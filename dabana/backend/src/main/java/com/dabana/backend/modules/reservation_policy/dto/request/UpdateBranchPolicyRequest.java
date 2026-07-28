package com.dabana.backend.modules.reservation_policy.dto.request;

import com.dabana.backend.modules.reservation_policy.util.PolicyStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateBranchPolicyRequest {

    @NotNull
    private PolicyStatus status;
}