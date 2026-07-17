package com.dabana.backend.modules.reservation_policy.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateReservationPolicyRequest {

    @NotBlank
    @Size(max = 50)
    private String policyCode;

    @NotBlank
    @Size(max = 255)
    private String name;

    private String description;

    private String termsAndConditions;

}