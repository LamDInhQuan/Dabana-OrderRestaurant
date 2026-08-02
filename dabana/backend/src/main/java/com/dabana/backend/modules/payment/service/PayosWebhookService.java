package com.dabana.backend.modules.payment.service;

import com.dabana.backend.modules.booking.Booking;
import com.dabana.backend.modules.booking.BookingRepository;
import com.dabana.backend.modules.booking.BookingStatus;
import com.dabana.backend.modules.notification.NotificationService;
import com.dabana.backend.modules.notification.NotificationType;
import com.dabana.backend.modules.payment.entity.DepositPayment;
import com.dabana.backend.modules.payment.entity.PayosWebhookLog;
import com.dabana.backend.modules.payment.repository.DepositPaymentRepository;
import com.dabana.backend.modules.payment.repository.PayosWebhookLogRepository;
import com.dabana.backend.modules.payment.util.AesEncryptionUtil;
import com.dabana.backend.modules.payment.util.DepositPaymentStatus;
import com.dabana.backend.modules.payment.util.PayosSignatureVerifier;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
public class PayosWebhookService {

    private static final DateTimeFormatter PAYOS_DATETIME_FORMAT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final DepositPaymentRepository depositPaymentRepository;
    private final PayosWebhookLogRepository payosWebhookLogRepository;
    private final BookingRepository bookingRepository;
    private final AesEncryptionUtil aesEncryptionUtil;
    private final NotificationService notificationService;
    private final com.dabana.backend.modules.admin.service.ISystemPolicyService systemPolicyService;

    public PayosWebhookService(DepositPaymentRepository depositPaymentRepository,
                                PayosWebhookLogRepository payosWebhookLogRepository,
                                BookingRepository bookingRepository,
                                AesEncryptionUtil aesEncryptionUtil,
                                NotificationService notificationService,
                                com.dabana.backend.modules.admin.service.ISystemPolicyService systemPolicyService) {
        this.depositPaymentRepository = depositPaymentRepository;
        this.payosWebhookLogRepository = payosWebhookLogRepository;
        this.bookingRepository = bookingRepository;
        this.aesEncryptionUtil = aesEncryptionUtil;
        this.notificationService = notificationService;
        this.systemPolicyService = systemPolicyService;
    }

    @Transactional
    public void process(String rawBody) throws Exception {
        JsonNode root = objectMapper.readTree(rawBody);
        JsonNode dataNode = root.path("data");
        String signature = root.path("signature").asText(null);
        Long orderCode = dataNode.path("orderCode").asLong();

        PayosWebhookLog logEntry = new PayosWebhookLog();
        logEntry.setOrderCode(orderCode);
        logEntry.setRawPayload(rawBody);
        logEntry.setSignature(signature);

        Optional<DepositPayment> depositOpt = depositPaymentRepository.findByOrderCode(orderCode);
        if (depositOpt.isEmpty()) {
            logEntry.setSignatureVerified(false);
            logEntry.setProcessed(false);
            payosWebhookLogRepository.save(logEntry);
            log.warn("Webhook payOS: khong tim thay DepositPayment cho orderCode={}", orderCode);
            return;
        }

        DepositPayment deposit = depositOpt.get();
        logEntry.setDepositPayment(deposit);
        logEntry.setAmount(dataNode.path("amount").decimalValue());
        logEntry.setReference(dataNode.path("reference").asText(null));
        logEntry.setAccountNumber(dataNode.path("accountNumber").asText(null));
        logEntry.setCounterAccountBankId(dataNode.path("counterAccountBankId").asText(null));
        logEntry.setCounterAccountBankName(dataNode.path("counterAccountBankName").asText(null));
        logEntry.setCounterAccountName(dataNode.path("counterAccountName").asText(null));
        logEntry.setCounterAccountNumber(dataNode.path("counterAccountNumber").asText(null));
        logEntry.setWebhookCode(dataNode.path("code").asText(null));
        logEntry.setWebhookDesc(dataNode.path("desc").asText(null));

        String transactionDateTimeRaw = dataNode.path("transactionDateTime").asText(null);
        if (transactionDateTimeRaw != null) {
            try {
                logEntry.setTransactionDatetime(LocalDateTime.parse(transactionDateTimeRaw, PAYOS_DATETIME_FORMAT));
            } catch (Exception ignored) {
                // giu null neu payOS doi dinh dang, khong lam fail ca webhook
            }
        }

        // checksum key CUA BRANCH so huu link thanh toan nay (kenh thanh toan rieng cua branch)
        String checksumKey = aesEncryptionUtil.decrypt(
                deposit.getBranchBankAccount().getPayosChecksumKeyEncrypted());

        @SuppressWarnings("unchecked")
        Map<String, Object> dataMap = objectMapper.convertValue(dataNode, LinkedHashMap.class);
        boolean verified = PayosSignatureVerifier.verify(dataMap, signature, checksumKey);
        logEntry.setSignatureVerified(verified);

        if (!verified) {
            logEntry.setProcessed(false);
            payosWebhookLogRepository.save(logEntry);
            log.error("Webhook payOS: SAI CHU KY cho orderCode={} - bo qua", orderCode);
            return;
        }

        if ("00".equals(logEntry.getWebhookCode()) && deposit.getStatus() != DepositPaymentStatus.PAID) {
            BigDecimal paidAmount = logEntry.getAmount() != null ? logEntry.getAmount() : deposit.getAmount();
            deposit.setAmountPaid(paidAmount);
            deposit.setAmountRemaining(deposit.getAmount().subtract(paidAmount));
            deposit.setStatus(DepositPaymentStatus.PAID);
            deposit.setPaidAt(LocalDateTime.now());
            depositPaymentRepository.save(deposit);

            // Dong bo rs_reservations: coc PAID -> xac nhan booking, tuong duong
            // logic cu tung nam o PaymentWebhookController.handlePayosWebhook().
            // Chi chuyen tu HOLDING/AWAITING_PAYMENT, khong dam len cac trang thai
            // khac (vd da CANCELLED/CHECKED_IN...) de tranh ghi de sai nghiep vu.
            Booking booking = deposit.getReservation();
            if (booking != null
                    && (booking.getStatus() == BookingStatus.HOLDING
                        || booking.getStatus() == BookingStatus.AWAITING_PAYMENT)) {
                booking.setStatus(BookingStatus.CONFIRMED);
                booking.setConfirmedAt(LocalDateTime.now());
                bookingRepository.save(booking);
                log.info("Webhook payOS: Booking id={} da CONFIRMED sau khi coc PAID (orderCode={})",
                        booking.getId(), orderCode);

                int graceMinutes = systemPolicyService.getGracePeriodMinutes();
                boolean graceEnabled = systemPolicyService.isGracePeriodEnabled();
                String graceNote = (graceEnabled && graceMinutes > 0)
                        ? String.format(" (Quý khách có thể huỷ và được hoàn 100%% tiền cọc trong vòng %d phút sau khi xác nhận)", graceMinutes)
                        : "";

                // B09 BR01: xac nhan dat ban tuc thi sau khi coc PAID.
                // Khach vang lai (khong co tai khoan User) chua co co che gui
                // thong bao qua Notification (recipient bat buoc la User).
                if (booking.getCustomer() != null) {
                    String content = String.format(
                            "Thanh toán tiền cọc thành công cho đơn đặt bàn lúc %s tại %s.%s",
                            booking.getReservationTime(), booking.getBranch().getName(), graceNote);
                    notificationService.sendImmediate(
                            booking.getCustomer(), NotificationType.PAYMENT_SUCCESS, content, "IN_APP", booking.getBranch().getId());
                }
                if (booking.getBranch() != null && booking.getBranch().getRestaurant() != null && booking.getBranch().getRestaurant().getOwner() != null) {
                    String restaurantContent = String.format(
                            "Có đơn đặt bàn mới tại %s lúc %s từ khách hàng %s (Đã cọc).%s",
                            booking.getBranch().getName(), booking.getReservationTime(), booking.getContactName(), graceNote);
                    notificationService.sendImmediate(
                            booking.getBranch().getRestaurant().getOwner(), NotificationType.BOOKING_CONFIRMED, restaurantContent, "IN_APP", booking.getBranch().getId());
                }
            }
        }

        logEntry.setProcessed(true);
        payosWebhookLogRepository.save(logEntry);
    }
}