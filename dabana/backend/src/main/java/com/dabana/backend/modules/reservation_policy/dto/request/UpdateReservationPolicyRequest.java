package com.dabana.backend.modules.reservation_policy.dto.request;

import com.dabana.backend.modules.reservation_policy.util.PolicyScheduleType;
import com.dabana.backend.modules.reservation_policy.util.PolicyStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateReservationPolicyRequest {

    @NotBlank
    @Size(max = 255)
    private String name;

    private String description;

    private String termsAndConditions;

    @NotNull
    private PolicyStatus status;

}