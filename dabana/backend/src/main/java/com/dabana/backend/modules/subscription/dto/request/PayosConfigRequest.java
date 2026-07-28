package com.dabana.backend.modules.subscription.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * apiKey/checksumKey de trong = KHONG doi (giu nguyen key da ma hoa cu) - giong
 * dung quy uoc cua UpdateBranchBankAccountRequest ben module payment, tranh
 * Admin phai nhap lai key moi lan chi sua clientId/webhookUrl.
 */
@Data
public class PayosConfigRequest {

    @NotBlank(message = "clientId không được để trống")
    @Size(max = 255)
    private String clientId;

    /** Để trống nếu không muốn đổi api key hiện tại. */
    private String apiKey;

    /** Để trống nếu không muốn đổi checksum key hiện tại. */
    private String checksumKey;

    @Size(max = 500)
    private String webhookUrl;

    private Boolean isActive;
}
