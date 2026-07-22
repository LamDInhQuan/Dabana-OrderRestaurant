package com.dabana.backend.modules.payment.service;

import com.dabana.backend.exception.BusinessException;
import com.dabana.backend.modules.auth.entity.User;
import com.dabana.backend.modules.booking.Booking;
import com.dabana.backend.modules.booking.BookingRepository;
import com.dabana.backend.modules.payment.dto.request.CreatePayoutOrderRequest;
import com.dabana.backend.modules.payment.dto.response.PayoutOrderResponse;
import com.dabana.backend.modules.payment.entity.BranchBankAccount;
import com.dabana.backend.modules.payment.entity.DepositPayment;
import com.dabana.backend.modules.payment.entity.PayoutOrder;
import com.dabana.backend.modules.payment.entity.RefundBankInfo;
import com.dabana.backend.modules.payment.mapper.PayoutOrderMapper;
import com.dabana.backend.modules.payment.repository.BranchBankAccountRepository;
import com.dabana.backend.modules.payment.repository.DepositPaymentRepository;
import com.dabana.backend.modules.payment.repository.PayoutOrderRepository;
import com.dabana.backend.modules.payment.repository.RefundBankInfoRepository;
import com.dabana.backend.modules.payment.util.DepositPaymentStatus;
import com.dabana.backend.modules.payment.util.PaymentErrorCode;
import com.dabana.backend.modules.payment.util.PayoutApprovalState;
import com.dabana.backend.modules.payment.util.PayoutState;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.payos.PayOS;
import vn.payos.exception.PayOSException;
import vn.payos.model.v1.payouts.Payout;
import vn.payos.model.v1.payouts.PayoutRequests;
import vn.payos.model.v1.payouts.PayoutTransaction;

import java.util.UUID;

/**
 * API that su cua SDK (xac nhan qua source github.com/payOSHQ/payos-lib-java):
 *   client.payouts().create(PayoutRequests, String idempotencyKey) -> Payout
 *
 * LUU Y VE ENUM: enum that su cua SDK (PayoutTransactionState, PayoutApprovalState
 * trong package vn.payos.model.v1.payouts) co NHIEU gia tri hon enum rut gon
 * PayoutState/PayoutApprovalState cua Dabana (com.dabana.backend.modules.payment.util).
 * 2 ham mapSdkState()/mapSdkApprovalState() ben duoi quy doi ve enum rut gon
 * cua minh - neu can giu nguyen 100% chi tiet tu payOS thi nen mo rong enum/
 * cot DB thay vi mapping (bao em neu muon doi huong nay).
 */
@Slf4j
@Service
public class PayoutOrderService {

    private final PayoutOrderRepository payoutOrderRepository;
    private final RefundBankInfoRepository refundBankInfoRepository;
    private final BranchBankAccountRepository branchBankAccountRepository;
    private final DepositPaymentRepository depositPaymentRepository;
    private final BookingRepository bookingRepository;
    private final PayosClientProvider payosClientProvider;
    private final PayoutOrderMapper payoutOrderMapper;

    public PayoutOrderService(PayoutOrderRepository payoutOrderRepository,
                               RefundBankInfoRepository refundBankInfoRepository,
                               BranchBankAccountRepository branchBankAccountRepository,
                               DepositPaymentRepository depositPaymentRepository,
                               BookingRepository bookingRepository,
                               PayosClientProvider payosClientProvider,
                               PayoutOrderMapper payoutOrderMapper) {
        this.payoutOrderRepository = payoutOrderRepository;
        this.refundBankInfoRepository = refundBankInfoRepository;
        this.branchBankAccountRepository = branchBankAccountRepository;
        this.depositPaymentRepository = depositPaymentRepository;
        this.bookingRepository = bookingRepository;
        this.payosClientProvider = payosClientProvider;
        this.payoutOrderMapper = payoutOrderMapper;
    }

    @Transactional
    public PayoutOrderResponse createPayoutOrder(CreatePayoutOrderRequest request, User requestedBy) {
        Booking booking = bookingRepository.findById(request.getReservationId())
                .orElseThrow(() -> new BusinessException(PaymentErrorCode.RESERVATION_NOT_FOUND));

        if (payoutOrderRepository.existsByReservation_Id(booking.getId())) {
            throw new BusinessException(PaymentErrorCode.PAYOUT_ALREADY_EXISTS);
        }

        RefundBankInfo refundBankInfo = refundBankInfoRepository.findByReservation_Id(booking.getId())
                .orElseThrow(() -> new BusinessException(PaymentErrorCode.REFUND_BANK_INFO_NOT_FOUND));

        BranchBankAccount sourceBranchBankAccount = branchBankAccountRepository
                .findByBranch_Id(booking.getBranch().getId())
                .orElseThrow(() -> new BusinessException(PaymentErrorCode.BRANCH_BANK_ACCOUNT_NOT_FOUND));

        DepositPayment paidDeposit = depositPaymentRepository
                .findByReservation_IdAndStatus(booking.getId(), DepositPaymentStatus.PAID)
                .orElseThrow(() -> new BusinessException(PaymentErrorCode.DEPOSIT_NOT_FOUND));

        PayOS client = payosClientProvider.getPayoutClientForBranch(booking.getBranch().getId());

        String idempotencyKey = "refund_" + booking.getId() + "_" + UUID.randomUUID();
        String referenceId = "REFUND-" + booking.getId() + "-" + System.currentTimeMillis();
        String description = request.getDescription() != null
                ? request.getDescription() : "Hoan coc dat ban " + booking.getId();
        String category = request.getCategory() != null ? request.getCategory() : "refund_deposit";

        Payout payosResponse;
        try {
            payosResponse = client.payouts().create(
                    PayoutRequests.builder()
                            .referenceId(referenceId)
                            .amount(paidDeposit.getAmountPaid().longValue())
                            .description(description)
                            .toBin(refundBankInfo.getBank().getBin())
                            .toAccountNumber(refundBankInfo.getAccountNumber())
                            .build(),
                    idempotencyKey);
        } catch (PayOSException e) {
            log.error("Tao lenh chi payOS that bai, reservationId={}", booking.getId(), e);
            throw new BusinessException(PaymentErrorCode.PAYOS_CREATE_PAYOUT_FAILED);
        }

        PayoutTransaction firstTxn = payosResponse.getTransactions().get(0);

        PayoutOrder entity = new PayoutOrder();
        entity.setReservation(booking);
        entity.setRefundBankInfo(refundBankInfo);
        entity.setSourceBranchBankAccount(sourceBranchBankAccount);
        entity.setIdempotencyKey(idempotencyKey);
        entity.setReferenceId(referenceId);
        entity.setAmount(paidDeposit.getAmountPaid());
        entity.setDescription(description);
        entity.setToBin(refundBankInfo.getBank().getBin());
        entity.setToAccountNumber(refundBankInfo.getAccountNumber());
        entity.setCategory(category);
        entity.setRequestedBy(requestedBy);

        entity.setPayosPayoutId(payosResponse.getId());
        entity.setPayosTransactionId(firstTxn.getId());
        entity.setToAccountName(firstTxn.getToAccountName());
        entity.setState(mapSdkState(firstTxn.getState()));
        entity.setApprovalState(mapSdkApprovalState(payosResponse.getApprovalState()));

        entity = payoutOrderRepository.save(entity);
        return payoutOrderMapper.toResponse(entity);
    }

    public PayoutOrderResponse getByReservation(Long reservationId) {
        PayoutOrder entity = payoutOrderRepository.findByReservation_Id(reservationId)
                .orElseThrow(() -> new BusinessException(PaymentErrorCode.PAYOUT_NOT_FOUND));
        return payoutOrderMapper.toResponse(entity);
    }

    /** Quy doi vn.payos.model.v1.payouts.PayoutTransactionState (SDK) -> PayoutState (Dabana). */
    private PayoutState mapSdkState(vn.payos.model.v1.payouts.PayoutTransactionState sdkState) {
        if (sdkState == null) {
            return PayoutState.PROCESSING;
        }
        switch (sdkState) {
            case SUCCEEDED:
                return PayoutState.SUCCEEDED;
            case CANCELLED:
                return PayoutState.CANCELLED;
            case FAILED:
            case REVERSED:
                return PayoutState.FAILED;
            case RECEIVED:
            case PROCESSING:
            case ON_HOLD:
            default:
                return PayoutState.PROCESSING;
        }
    }

    /** Quy doi vn.payos.model.v1.payouts.PayoutApprovalState (SDK) -> PayoutApprovalState (Dabana). */
    private PayoutApprovalState mapSdkApprovalState(vn.payos.model.v1.payouts.PayoutApprovalState sdkState) {
        if (sdkState == null) {
            return PayoutApprovalState.PROCESSING;
        }
        switch (sdkState) {
            case COMPLETED:
                return PayoutApprovalState.SUCCEEDED;
            case REJECTED:
                return PayoutApprovalState.REJECTED;
            case FAILED:
                return PayoutApprovalState.FAILED;
            case CANCELLED:
                return PayoutApprovalState.REJECTED; // khong co CANCELLED rieng trong enum rut gon
            case DRAFTING:
            case SUBMITTED:
            case APPROVED:
            case SCHEDULED:
            case PROCESSING:
            case PARTIAL_COMPLETED:
            default:
                return PayoutApprovalState.PROCESSING;
        }
    }
}