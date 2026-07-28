package com.dabana.backend.modules.subscription.service;

import com.dabana.backend.exception.BusinessException;
import com.dabana.backend.modules.payment.util.AesEncryptionUtil;
import com.dabana.backend.modules.subscription.entity.PayosConfig;
import com.dabana.backend.modules.subscription.repository.PayosConfigRepository;
import com.dabana.backend.modules.subscription.util.SubscriptionErrorCode;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import vn.payos.PayOS;

import java.util.concurrent.atomic.AtomicReference;

/**
 * Tao va cache client PayOS (SDK vn.payos.PayOS) CAP NEN TANG cho module
 * subscription, doc credential tu bang sub_payos_config (Admin nhap qua API)
 * thay vi hardcode nhu config/PayOSConfig.java hien tai dang dung cho booking.
 *
 * Uu diem so voi PayOSConfig.payOS() (mot @Bean co dinh luc khoi dong app):
 * Admin doi client-id/api-key/checksum-key qua API xong la co hieu luc ngay,
 * khong can build/deploy lai - chi can goi invalidate() sau khi luu cau hinh moi.
 */
@Component
public class SubscriptionPayosClientProvider {

    private final PayosConfigRepository payosConfigRepository;
    private final AesEncryptionUtil aesEncryptionUtil;

    private final AtomicReference<PayOS> cachedClient = new AtomicReference<>();

    public SubscriptionPayosClientProvider(PayosConfigRepository payosConfigRepository,
                                            AesEncryptionUtil aesEncryptionUtil) {
        this.payosConfigRepository = payosConfigRepository;
        this.aesEncryptionUtil = aesEncryptionUtil;
    }

    public PayOS getClient() {
        PayOS existing = cachedClient.get();
        if (existing != null) {
            return existing;
        }
        PayOS built = buildClient();
        cachedClient.set(built);
        return built;
    }

    /** Goi sau khi Admin luu lai cau hinh moi, de lan goi tiep theo tao client voi key moi. */
    public void invalidate() {
        cachedClient.set(null);
    }

    private PayOS buildClient() {
        PayosConfig config = payosConfigRepository.findFirstByIsActiveTrueOrderByIdAsc()
                .orElseThrow(() -> new BusinessException(SubscriptionErrorCode.PAYOS_CONFIG_MISSING));

        if (!StringUtils.hasText(config.getClientId())
                || !StringUtils.hasText(config.getApiKeyEncrypted())
                || !StringUtils.hasText(config.getChecksumKeyEncrypted())) {
            throw new BusinessException(SubscriptionErrorCode.PAYOS_CONFIG_MISSING);
        }

        return new PayOS(
                config.getClientId(),
                aesEncryptionUtil.decrypt(config.getApiKeyEncrypted()),
                aesEncryptionUtil.decrypt(config.getChecksumKeyEncrypted()));
    }
}
