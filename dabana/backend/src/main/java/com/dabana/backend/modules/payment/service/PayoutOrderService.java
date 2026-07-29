package com.dabana.backend.modules.payment.service;

import com.dabana.backend.exception.BusinessException;
import com.dabana.backend.modules.auth.entity.User;
import com.dabana.backend.modules.booking.Booking;
import com.dabana.backend.modules.booking.BookingRepository;
import com.dabana.backend.modules.booking.util.RefundStatus;
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

import java.math.BigDecimal;
import java.util.List;
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

        // Bat buoc booking phai da qua BookingService.cancel() - noi tinh refundAmount
        // theo policySnapshot (chinh sach huy da chot luc dat ban), KHONG cho phep
        // tao lenh chi tuy y voi so tien tu request nua.
        if (booking.getRefundStatus() != RefundStatus.PENDING) {
            throw new BusinessException(PaymentErrorCode.REFUND_NOT_ELIGIBLE);
        }
        BigDecimal refundAmount = booking.getRefundAmount();
        if (refundAmount == null || refundAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException(PaymentErrorCode.REFUND_AMOUNT_ZERO);
        }

        RefundBankInfo refundBankInfo = refundBankInfoRepository.findByReservation_Id(booking.getId())
                .orElseThrow(() -> new BusinessException(PaymentErrorCode.REFUND_BANK_INFO_NOT_FOUND));

        BranchBankAccount sourceBranchBankAccount = branchBankAccountRepository
                .findByBranch_Id(booking.getBranch().getId())
                .orElseThrow(() -> new BusinessException(PaymentErrorCode.BRANCH_BANK_ACCOUNT_NOT_FOUND));

        // Van kiem tra ton tai coc PAID de chan cac truong hop du lieu bat thuong
        // (vd refundStatus=PENDING nhung khong con ban ghi coc PAID nao) - amount
        // thuc te dung de tao lenh chi la refundAmount o tren, KHONG phai amountPaid.
        depositPaymentRepository
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
                            .amount(refundAmount.longValue())
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
        entity.setAmount(refundAmount);
        entity.setDescription(description);
        entity.setToBin(refundBankInfo.getBank().getBin());
        entity.setToAccountNumber(refundBankInfo.getAccountNumber());
        entity.setCategory(category);
        entity.setRequestedBy(requestedBy);

        entity.setPayosPayoutId(payosResponse.getId());
        entity.setPayosTransactionId(firstTxn.getId());
        entity.setToAccountName(firstTxn.getToAccountName());
        PayoutState mappedState = mapSdkState(firstTxn.getState());
        entity.setState(mappedState);
        entity.setApprovalState(mapSdkApprovalState(payosResponse.getApprovalState()));

        entity = payoutOrderRepository.save(entity);

        // Dong bo refundStatus cua booking theo ket qua tao lenh chi. Neu payOS
        // van dang xu ly (PROCESSING) thi giu nguyen PENDING - PaymentScheduledTasks
        // (chay dinh ky) se tu poll va cap nhat SUCCESS/FAILED sau (xem syncProcessingPayouts()).
        if (mappedState == PayoutState.SUCCEEDED) {
            booking.setRefundStatus(RefundStatus.SUCCESS);
            bookingRepository.save(booking);
        } else if (mappedState == PayoutState.FAILED || mappedState == PayoutState.CANCELLED) {
            booking.setRefundStatus(RefundStatus.FAILED);
            bookingRepository.save(booking);
        }

        return payoutOrderMapper.toResponse(entity);
    }

    public PayoutOrderResponse getByReservation(Long reservationId) {
        PayoutOrder entity = payoutOrderRepository.findByReservation_Id(reservationId)
                .orElseThrow(() -> new BusinessException(PaymentErrorCode.PAYOUT_NOT_FOUND));
        return payoutOrderMapper.toResponse(entity);
    }

    /**
     * payOS HIEN KHONG CO webhook cho lenh chi (chi co webhook cho link thanh
     * toan/Thu - da xac nhan qua tai lieu chinh thuc https://payos.vn/docs/api/,
     * muc "Chi" chi co: tao lenh chi don/hang loat, lay danh sach, lay thong tin,
     * uoc tinh phi - khong co event webhook nao ca).
     *
     * -> Thay the bang co che POLLING: chay dinh ky (xem PaymentScheduledTasks),
     * duyet tat ca PayoutOrder dang o state PROCESSING, goi GET /v1/payouts/{id}
     * de lay trang thai moi nhat, cap nhat state/approvalState va dong bo nguoc
     * Booking.refundStatus (SUCCESS/FAILED) tuong ung.
     *
     * Loi khi dong bo 1 lenh KHONG duoc lam dung ca job - chi log va tiep tuc
     * voi cac lenh con lai.
     */
    @Transactional
    public void syncProcessingPayouts() {
        List<PayoutOrder> processing = payoutOrderRepository.findByState(PayoutState.PROCESSING);
        for (PayoutOrder entity : processing) {
            try {
                syncOnePayout(entity);
            } catch (Exception e) {
                log.error("Loi dong bo payout id={}, payosPayoutId={}",
                        entity.getId(), entity.getPayosPayoutId(), e);
            }
        }
    }

    private void syncOnePayout(PayoutOrder entity) {
        if (entity.getPayosPayoutId() == null) {
            return;
        }
        Booking booking = entity.getReservation();
        PayOS client = payosClientProvider.getPayoutClientForBranch(booking.getBranch().getId());

        // LUU Y: chua the xac minh chinh xac ten method cua SDK payos-lib-java cho
        // GET /v1/payouts/{payoutId} (khong co jar SDK trong moi truong nay de doc
        // truc tiep) - dua theo cung pattern voi client.payouts().create(...) da
        // dung o createPayoutOrder(). Neu ten method thuc te khac (vd .retrieve()
        // thay vi .get()), chi can sua dong duoi day, phan con lai giu nguyen.
        Payout payosResponse;
        try {
            payosResponse = client.payouts().get(entity.getPayosPayoutId());
        } catch (PayOSException e) {
            log.error("Khong the goi payOS de lay thong tin payout id={}, payosPayoutId={}",
                    entity.getId(), entity.getPayosPayoutId(), e);
            return;
        }

        PayoutTransaction firstTxn = payosResponse.getTransactions().get(0);
        PayoutState newState = mapSdkState(firstTxn.getState());
        PayoutApprovalState newApprovalState = mapSdkApprovalState(payosResponse.getApprovalState());

        boolean changed = newState != entity.getState() || newApprovalState != entity.getApprovalState();
        entity.setState(newState);
        entity.setApprovalState(newApprovalState);
        if (firstTxn.getToAccountName() != null) {
            entity.setToAccountName(firstTxn.getToAccountName());
        }
        if (!changed) {
            return;
        }
        payoutOrderRepository.save(entity);

        if (newState == PayoutState.SUCCEEDED) {
            booking.setRefundStatus(RefundStatus.SUCCESS);
            bookingRepository.save(booking);
            log.info("Dong bo payout: bookingId={} refundStatus=SUCCESS (payosPayoutId={})",
                    booking.getId(), entity.getPayosPayoutId());
        } else if (newState == PayoutState.FAILED || newState == PayoutState.CANCELLED) {
            booking.setRefundStatus(RefundStatus.FAILED);
            bookingRepository.save(booking);
            log.warn("Dong bo payout: bookingId={} refundStatus=FAILED (payosPayoutId={}, state={})",
                    booking.getId(), entity.getPayosPayoutId(), newState);
        }
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