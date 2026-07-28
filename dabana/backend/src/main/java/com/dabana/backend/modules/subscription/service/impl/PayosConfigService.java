package com.dabana.backend.modules.subscription.service.impl;

import com.dabana.backend.modules.payment.util.AesEncryptionUtil;
import com.dabana.backend.modules.subscription.dto.request.PayosConfigRequest;
import com.dabana.backend.modules.subscription.dto.response.PayosConfigResponse;
import com.dabana.backend.modules.subscription.entity.PayosConfig;
import com.dabana.backend.modules.subscription.repository.PayosConfigRepository;
import com.dabana.backend.modules.subscription.service.IPayosConfigService;
import com.dabana.backend.modules.subscription.service.SubscriptionPayosClientProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class PayosConfigService implements IPayosConfigService {

    private final PayosConfigRepository payosConfigRepository;
    private final AesEncryptionUtil aesEncryptionUtil;
    private final SubscriptionPayosClientProvider payosClientProvider;

    @Override
    @Transactional(readOnly = true)
    public PayosConfigResponse getConfig() {
        return payosConfigRepository.findFirstByIsActiveTrueOrderByIdAsc()
                .map(this::toResponse)
                .orElse(null);
    }

    @Override
    public PayosConfigResponse saveConfig(PayosConfigRequest request) {
        PayosConfig config = payosConfigRepository.findFirstByIsActiveTrueOrderByIdAsc()
                .orElseGet(PayosConfig::new);

        config.setClientId(request.getClientId());
        if (StringUtils.hasText(request.getApiKey())) {
            config.setApiKeyEncrypted(aesEncryptionUtil.encrypt(request.getApiKey()));
        }
        if (StringUtils.hasText(request.getChecksumKey())) {
            config.setChecksumKeyEncrypted(aesEncryptionUtil.encrypt(request.getChecksumKey()));
        }
        if (request.getWebhookUrl() != null) {
            config.setWebhookUrl(request.getWebhookUrl());
        }
        if (request.getIsActive() != null) {
            config.setIsActive(request.getIsActive());
        }
        config = payosConfigRepository.save(config);

        // Key vua doi (neu co) -> xoa client cache de lan goi tiep theo dung key moi.
        payosClientProvider.invalidate();

        tryConfirmWebhook(config);

        return toResponse(config);
    }

    /**
     * Dang ky webhookUrl voi payOS qua SDK (best-effort). KHONG chan viec luu
     * cau hinh neu buoc nay that bai - Admin van co the tu dang ky thu cong tren
     * my.payos.vn/dashboard nhu cach du an dang lam voi kenh thanh toan coc
     * (xem comment trong PayosWebhookController.java module payment).
     *
     * TODO: doi chieu chinh xac ten method cua SDK payos-java qua
     * https://javadoc.io/doc/vn.payos/payos-java truoc khi coi day la da xong -
     * hien dang goi thu client.webhooks().confirm(url) theo dung comment co san
     * trong PayosWebhookController.java, CHUA duoc test thuc te.
     */
    private void tryConfirmWebhook(PayosConfig config) {
        if (!StringUtils.hasText(config.getWebhookUrl())) {
            return;
        }
        try {
            var client = payosClientProvider.getClient();
            client.webhooks().confirm(config.getWebhookUrl());
            log.info("Da dang ky webhookUrl voi payOS: {}", config.getWebhookUrl());
        } catch (Exception e) {
            log.warn("Khong the tu dong dang ky webhookUrl voi payOS ({}). "
                    + "Vui long dang ky thu cong tren dashboard payOS (my.payos.vn) neu can.",
                    config.getWebhookUrl(), e);
        }
    }

    private PayosConfigResponse toResponse(PayosConfig config) {
        boolean configured = StringUtils.hasText(config.getClientId())
                && StringUtils.hasText(config.getApiKeyEncrypted())
                && StringUtils.hasText(config.getChecksumKeyEncrypted());
        return PayosConfigResponse.builder()
                .id(config.getId())
                .clientId(config.getClientId())
                .configured(configured)
                .webhookUrl(config.getWebhookUrl())
                .isActive(config.getIsActive())
                .updatedAt(config.getUpdatedAt())
                .build();
    }
}
