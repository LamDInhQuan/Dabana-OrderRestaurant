package com.dabana.backend.modules.auth.dto.request;

import com.dabana.backend.modules.auth.util.OtpPurpose;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

@Getter
public class SendOtpRequest {
    @NotBlank()
    @Email()
    private String email;

    @NotNull()
    private OtpPurpose purpose;
}
