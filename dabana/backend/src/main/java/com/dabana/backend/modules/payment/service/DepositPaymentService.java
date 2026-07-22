package com.dabana.backend.modules.payment.service;

import com.dabana.backend.exception.BusinessException;
import com.dabana.backend.modules.booking.Booking;
import com.dabana.backend.modules.booking.BookingRepository;
import com.dabana.backend.modules.payment.dto.request.CancelDepositPaymentRequest;
import com.dabana.backend.modules.payment.dto.request.CreateDepositPaymentRequest;
import com.dabana.backend.modules.payment.dto.response.DepositPaymentResponse;
import com.dabana.backend.modules.payment.entity.BranchBankAccount;
import com.dabana.backend.modules.payment.entity.DepositPayment;
import com.dabana.backend.modules.payment.mapper.DepositPaymentMapper;
import com.dabana.backend.modules.payment.repository.BranchBankAccountRepository;
import com.dabana.backend.modules.payment.repository.DepositPaymentRepository;
import com.dabana.backend.modules.payment.util.DepositPaymentStatus;
import com.dabana.backend.modules.payment.util.PaymentErrorCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.payos.PayOS;
import vn.payos.exception.PayOSException;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest;
import vn.payos.model.v2.paymentRequests.CreatePaymentLinkResponse;

import java.time.LocalDateTime;
import java.util.List;

/**
 * LUU Y: ten class SDK (CreatePaymentLinkRequest/Response,
 * CancelPaymentLinkRequest,
 * PayOSException...) lay theo README cua payos-lib-java. Doi chieu lai chinh
 * xac qua https://javadoc.io/doc/vn.payos/payos-java truoc khi build.
 */
@Slf4j
@Service
public class DepositPaymentService {

    private static final List<DepositPaymentStatus> ACTIVE_STATUSES = List.of(DepositPaymentStatus.PENDING,
            DepositPaymentStatus.PROCESSING);

    private final DepositPaymentRepository depositPaymentRepository;
    private final BranchBankAccountRepository branchBankAccountRepository;
    private final BookingRepository bookingRepository;
    private final PayosClientProvider payosClientProvider;
    private final DepositPaymentMapper depositPaymentMapper;

    @Value("${app.payment.cancel-url-template}")
    private String cancelUrlTemplate;

    @Value("${app.payment.return-url-template}")
    private String returnUrlTemplate;

    public DepositPaymentService(DepositPaymentRepository depositPaymentRepository,
            BranchBankAccountRepository branchBankAccountRepository,
            BookingRepository bookingRepository,
            PayosClientProvider payosClientProvider,
            DepositPaymentMapper depositPaymentMapper) {
        this.depositPaymentRepository = depositPaymentRepository;
        this.branchBankAccountRepository = branchBankAccountRepository;
        this.bookingRepository = bookingRepository;
        this.payosClientProvider = payosClientProvider;
        this.depositPaymentMapper = depositPaymentMapper;
    }

    @Transactional
    public DepositPaymentResponse createDepositPayment(CreateDepositPaymentRequest request) {
        Booking booking = bookingRepository.findById(request.getReservationId())
                .orElseThrow(() -> new BusinessException(PaymentErrorCode.RESERVATION_NOT_FOUND));

        boolean hasActiveDeposit = depositPaymentRepository
                .findFirstByReservation_IdAndStatusInOrderByIdDesc(booking.getId(), ACTIVE_STATUSES)
                .isPresent();
        if (hasActiveDeposit) {
            throw new BusinessException(PaymentErrorCode.DEPOSIT_ALREADY_EXISTS);
        }

        // Doi chieu voi snapshot cua booking (neu co) de tranh FE gui sai/gian lan so
        // tien.
        if (booking.getSnapshotDepositAmount() != null
                && booking.getSnapshotDepositAmount().compareTo(request.getAmount()) != 0) {
            throw new BusinessException(PaymentErrorCode.DEPOSIT_AMOUNT_INVALID);
        }

        BranchBankAccount branchBankAccount = branchBankAccountRepository
                .findByBranch_Id(booking.getBranch().getId())
                .orElseThrow(() -> new BusinessException(PaymentErrorCode.BRANCH_BANK_ACCOUNT_NOT_FOUND));

        PayOS client = payosClientProvider.getPaymentClientForBranch(booking.getBranch().getId());

        long orderCode = System.currentTimeMillis(); // don gian, du duy nhat o quy mo hien tai
        String description = "Coc dat ban " + booking.getId();
        String cancelUrl = cancelUrlTemplate.replace("{reservationId}", String.valueOf(booking.getId()));
        String returnUrl = returnUrlTemplate.replace("{reservationId}", String.valueOf(booking.getId()));
        String buyerEmail = booking.getCustomer() != null ? booking.getCustomer().getEmail() : null;

        CreatePaymentLinkRequest payload = CreatePaymentLinkRequest.builder()
                .orderCode(orderCode)
                .amount(request.getAmount().longValue())
                .description(description)
                .buyerName(booking.getContactName())
                .buyerEmail(buyerEmail)
                .buyerPhone(booking.getContactPhone())
                .cancelUrl(cancelUrl)
                .returnUrl(returnUrl)
                .build();

        CreatePaymentLinkResponse payosResponse;
        try {
            payosResponse = client.paymentRequests().create(payload);
        } catch (PayOSException e) {
            log.error("Tao link thanh toan payOS that bai, reservationId={}", booking.getId(), e);
            throw new BusinessException(PaymentErrorCode.PAYOS_CREATE_PAYMENT_LINK_FAILED);
        }

        DepositPayment entity = new DepositPayment();
        entity.setReservation(booking);
        entity.setBranchBankAccount(branchBankAccount);
        entity.setOrderCode(orderCode);
        entity.setAmount(request.getAmount());
        entity.setDescription(description);
        entity.setBuyerName(booking.getContactName());
        entity.setBuyerEmail(buyerEmail);
        entity.setBuyerPhone(booking.getContactPhone());
        entity.setCancelUrl(cancelUrl);
        entity.setReturnUrl(returnUrl);
        entity.setPayosPaymentLinkId(payosResponse.getPaymentLinkId());
        entity.setCheckoutUrl(payosResponse.getCheckoutUrl());
        entity.setQrCode(payosResponse.getQrCode());
        entity.setBin(payosResponse.getBin());
        entity.setAccountNumber(payosResponse.getAccountNumber());
        entity.setAccountName(payosResponse.getAccountName());
        entity.setStatus(DepositPaymentStatus.PENDING);

        entity = depositPaymentRepository.save(entity);
        return depositPaymentMapper.toResponse(entity);
    }

    public DepositPaymentResponse getActiveByReservation(Long reservationId) {
        DepositPayment entity = depositPaymentRepository
                .findFirstByReservation_IdAndStatusInOrderByIdDesc(reservationId, ACTIVE_STATUSES)
                .orElseThrow(() -> new BusinessException(PaymentErrorCode.DEPOSIT_NOT_FOUND));
        return depositPaymentMapper.toResponse(entity);
    }

    @Transactional
    public DepositPaymentResponse cancelDepositPayment(Long reservationId, CancelDepositPaymentRequest request) {
        DepositPayment entity = depositPaymentRepository
                .findFirstByReservation_IdAndStatusInOrderByIdDesc(reservationId, ACTIVE_STATUSES)
                .orElseThrow(() -> new BusinessException(PaymentErrorCode.DEPOSIT_NOT_FOUND));

        if (entity.getStatus() == DepositPaymentStatus.PAID) {
            throw new BusinessException(PaymentErrorCode.DEPOSIT_ALREADY_PAID);
        }

        PayOS client = payosClientProvider.getPaymentClientForBranch(
                entity.getBranchBankAccount().getBranch().getId());

        try {
            client.paymentRequests().cancel(entity.getOrderCode(), request.getCancellationReason());
        } catch (PayOSException e) {
            log.error("Huy link thanh toan payOS that bai, orderCode={}", entity.getOrderCode(), e);
            throw new BusinessException(PaymentErrorCode.PAYOS_CANCEL_PAYMENT_FAILED);
        }

        entity.setStatus(DepositPaymentStatus.CANCELLED);
        entity.setCancellationReason(request.getCancellationReason());
        entity.setCanceledAt(LocalDateTime.now());
        entity = depositPaymentRepository.save(entity);
        return depositPaymentMapper.toResponse(entity);
    }
}