package com.dabana.backend.modules.payment.service;

import com.dabana.backend.exception.BusinessException;
import com.dabana.backend.modules.payment.entity.BranchBankAccount;
import com.dabana.backend.modules.payment.repository.BranchBankAccountRepository;
import com.dabana.backend.modules.payment.util.AesEncryptionUtil;
import com.dabana.backend.modules.payment.util.PaymentErrorCode;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import vn.payos.PayOS;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Tao va cache PayOS client (SDK vn.payos.PayOS) RIENG CHO TUNG BRANCH — ca
 * kenh THU lan kenh CHI. Dung constructor 3 tham so (clientId, apiKey,
 * checksumKey) cua PayOS, khong can qua ClientOptions.
 */
@Component
public class PayosClientProvider {

    private final BranchBankAccountRepository branchBankAccountRepository;
    private final AesEncryptionUtil aesEncryptionUtil;

    private final Map<Long, PayOS> paymentClientCache = new ConcurrentHashMap<>();
    private final Map<Long, PayOS> payoutClientCache = new ConcurrentHashMap<>();

    public PayosClientProvider(BranchBankAccountRepository branchBankAccountRepository,
                                AesEncryptionUtil aesEncryptionUtil) {
        this.branchBankAccountRepository = branchBankAccountRepository;
        this.aesEncryptionUtil = aesEncryptionUtil;
    }

    /** Client dung de tao/huy link thu coc cho reservation thuoc branch nay. */
    public PayOS getPaymentClientForBranch(Long branchId) {
        BranchBankAccount account = findActiveAccount(branchId);
        return paymentClientCache.computeIfAbsent(account.getId(), id -> buildPaymentClient(account));
    }

    /** Client dung de tao lenh chi hoan coc cho reservation thuoc branch nay. */
    public PayOS getPayoutClientForBranch(Long branchId) {
        BranchBankAccount account = findActiveAccount(branchId);
        return payoutClientCache.computeIfAbsent(account.getId(), id -> buildPayoutClient(account));
    }

    /** Goi sau khi credential (thu hoac chi) cua branch duoc cap nhat. */
    public void invalidate(Long branchBankAccountId) {
        paymentClientCache.remove(branchBankAccountId);
        payoutClientCache.remove(branchBankAccountId);
    }

    private BranchBankAccount findActiveAccount(Long branchId) {
        BranchBankAccount account = branchBankAccountRepository.findByBranch_Id(branchId)
                .orElseThrow(() -> new BusinessException(PaymentErrorCode.BRANCH_BANK_ACCOUNT_NOT_FOUND));
        if (!Boolean.TRUE.equals(account.getIsActive())) {
            throw new BusinessException(PaymentErrorCode.BRANCH_BANK_ACCOUNT_INACTIVE);
        }
        return account;
    }

    private PayOS buildPaymentClient(BranchBankAccount account) {
        if (!StringUtils.hasText(account.getPayosClientId())
                || !StringUtils.hasText(account.getPayosApiKeyEncrypted())
                || !StringUtils.hasText(account.getPayosChecksumKeyEncrypted())) {
            throw new BusinessException(PaymentErrorCode.PAYOS_CONFIG_MISSING);
        }
        return new PayOS(
                account.getPayosClientId(),
                aesEncryptionUtil.decrypt(account.getPayosApiKeyEncrypted()),
                aesEncryptionUtil.decrypt(account.getPayosChecksumKeyEncrypted()));
    }

    private PayOS buildPayoutClient(BranchBankAccount account) {
        if (!StringUtils.hasText(account.getPayosPayoutClientId())
                || !StringUtils.hasText(account.getPayosPayoutApiKeyEncrypted())
                || !StringUtils.hasText(account.getPayosPayoutChecksumKeyEncrypted())) {
            throw new BusinessException(PaymentErrorCode.PAYOS_CONFIG_MISSING);
        }
        return new PayOS(
                account.getPayosPayoutClientId(),
                aesEncryptionUtil.decrypt(account.getPayosPayoutApiKeyEncrypted()),
                aesEncryptionUtil.decrypt(account.getPayosPayoutChecksumKeyEncrypted()));
    }
}