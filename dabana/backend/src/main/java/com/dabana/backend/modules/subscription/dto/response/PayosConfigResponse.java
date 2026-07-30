package com.dabana.backend.modules.subscription.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/** KHONG BAO GIO tra ve apiKey/checksumKey thuc (chi mask) - chi bao da cau hinh hay chua. */
@Getter
@Setter
@Builder
@AllArgsConstructor
public class PayosConfigResponse {
    private Long id;
    private String clientId;
    /** true nếu cả apiKey và checksumKey đã được cấu hình. */
    private Boolean configured;
    private String webhookUrl;
    private Boolean isActive;
    private LocalDateTime updatedAt;
    /**
     * true neu lan luu gan nhat da goi payOS xac nhan webhookUrl THANH CONG.
     * null neu chua tung thu (vd goi GET config, hoac chua co webhookUrl).
     */
    private Boolean webhookConfirmed;
    /** Thong diep loi tu payOS neu webhookConfirmed = false, de Admin biet ly do. */
    private String webhookConfirmError;
}