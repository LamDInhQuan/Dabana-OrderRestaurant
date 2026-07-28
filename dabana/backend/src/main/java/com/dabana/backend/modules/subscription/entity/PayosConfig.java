package com.dabana.backend.modules.subscription.entity;

import com.dabana.backend.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

/**
 * Cau hinh payOS CAP NEN TANG (khac voi pm_branch_bank_accounts la cap tung
 * chi nhanh, dung de nha hang nhan tien coc). Bang nay chi thu phi Dabana thu
 * TU nha hang, nen la MOT tai khoan payOS DUY NHAT dung chung cho toan he
 * thong - luon chi co 1 dong (id nho nhat con is_active=true la dong dang dung).
 *
 * api_key/checksum_key luu o dang MA HOA (AesEncryptionUtil, tai su dung tu
 * module payment - dung chung 1 secret app.payment.encryption-secret).
 */
@Getter
@Setter
@Entity
@Table(name = "sub_payos_config")
public class PayosConfig extends BaseEntity {

    @Column(name = "client_id", nullable = false, length = 255)
    private String clientId;

    @Column(name = "api_key_encrypted", nullable = false, length = 255)
    private String apiKeyEncrypted;

    @Column(name = "checksum_key_encrypted", nullable = false, length = 255)
    private String checksumKeyEncrypted;

    /**
     * URL webhook DA (hoac se) dang ky voi payOS - chi mang tinh tham chieu/hien
     * thi cho Admin, dong thoi la URL se duoc goi qua client.webhooks().confirm()
     * khi luu cau hinh (best-effort, khong chan viec luu neu goi that bai - xem
     * PayosConfigService).
     */
    @Column(name = "webhook_url", length = 500)
    private String webhookUrl;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
}
