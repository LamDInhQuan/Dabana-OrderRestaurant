package com.dabana.backend.modules.subscription.service.impl;

import com.dabana.backend.modules.payment.util.AesEncryptionUtil;
import com.dabana.backend.modules.payment.util.PayosSignatureVerifier;
import com.dabana.backend.modules.subscription.entity.PayosConfig;
import com.dabana.backend.modules.subscription.entity.SubPayosWebhookLog;
import com.dabana.backend.modules.subscription.entity.SubscriptionInvoice;
import com.dabana.backend.modules.subscription.enums.InvoiceStatus;
import com.dabana.backend.modules.subscription.repository.PayosConfigRepository;
import com.dabana.backend.modules.subscription.repository.SubPayosWebhookLogRepository;
import com.dabana.backend.modules.subscription.repository.SubscriptionInvoiceRepository;
import com.dabana.backend.modules.subscription.service.ISubscriptionService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

/**
 * Xu ly webhook payOS cho THANH TOAN SUBSCRIPTION. Khac voi PayosWebhookService
 * (module payment, dung checksumKey RIENG CUA TUNG BRANCH), o day chi co DUY
 * NHAT 1 checksumKey CAP NEN TANG (bang sub_payos_config), vi day la 1 tai
 * khoan payOS duy nhat dung chung cho toan he thong (Dabana thu tien TU nha
 * hang, khong phai khach hang tra coc cho tung chi nhanh).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SubPayosWebhookService {

    private static final DateTimeFormatter PAYOS_DATETIME_FORMAT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final ObjectMapper objectMapper = new ObjectMapper();

    private final SubscriptionInvoiceRepository invoiceRepository;
    private final SubPayosWebhookLogRepository webhookLogRepository;
    private final PayosConfigRepository payosConfigRepository;
    private final AesEncryptionUtil aesEncryptionUtil;
    private final ISubscriptionService subscriptionService;

    @Transactional
    public void process(String rawBody) throws Exception {
        JsonNode root = objectMapper.readTree(rawBody);
        JsonNode dataNode = root.path("data");
        String signature = root.path("signature").asText(null);
        Long orderCode = dataNode.path("orderCode").asLong();

        SubPayosWebhookLog logEntry = new SubPayosWebhookLog();
        logEntry.setOrderCode(orderCode);
        logEntry.setRawPayload(rawBody);
        logEntry.setSignature(signature);

        // Tim SubscriptionInvoice theo orderCode truoc, neu chua co (du lieu cu) thi fallback theo id
        Optional<SubscriptionInvoice> invoiceOpt = invoiceRepository.findByOrderCode(orderCode);
        if (invoiceOpt.isEmpty()) {
            invoiceOpt = invoiceRepository.findById(orderCode);
        }

        if (invoiceOpt.isEmpty()) {
            logEntry.setSignatureVerified(false);
            logEntry.setProcessed(false);
            webhookLogRepository.save(logEntry);
            log.warn("Webhook payOS subscription: khong tim thay SubscriptionInvoice cho orderCode={}", orderCode);
            return;
        }

        SubscriptionInvoice invoice = invoiceOpt.get();
        logEntry.setInvoice(invoice);
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

        Optional<PayosConfig> configOpt = payosConfigRepository.findFirstByIsActiveTrueOrderByIdAsc();
        if (configOpt.isEmpty()) {
            logEntry.setSignatureVerified(false);
            logEntry.setProcessed(false);
            webhookLogRepository.save(logEntry);
            log.error("Webhook payOS subscription: chua co PayosConfig de xac thuc chu ky, orderCode={}", orderCode);
            return;
        }
        String checksumKey = aesEncryptionUtil.decrypt(configOpt.get().getChecksumKeyEncrypted());

        @SuppressWarnings("unchecked")
        Map<String, Object> dataMap = objectMapper.convertValue(dataNode, LinkedHashMap.class);
        boolean verified = PayosSignatureVerifier.verify(dataMap, signature, checksumKey);
        logEntry.setSignatureVerified(verified);

        if (!verified) {
            logEntry.setProcessed(false);
            webhookLogRepository.save(logEntry);
            log.error("Webhook payOS subscription: SAI CHU KY cho orderCode={} - bo qua", orderCode);
            return;
        }

        if ("00".equals(logEntry.getWebhookCode())
                && invoice.getStatus() != InvoiceStatus.PAID
                && invoice.getStatus() != InvoiceStatus.CANCELLED) {
            // Tai su dung DUNG 1 duong xu ly voi luc Admin xac nhan thu cong (markInvoicePaidManually) -
            // khong viet lai logic ap dung snapshot/kich hoat subscription o day, tranh 2 noi 2 logic khac nhau.
            subscriptionService.markInvoicePaidManually(invoice.getId());
        }

        logEntry.setProcessed(true);
        webhookLogRepository.save(logEntry);
    }
}
