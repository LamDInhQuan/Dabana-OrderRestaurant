package com.dabana.backend.modules.reservation_policy.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AssignBranchPolicyRequest {

    @NotNull
    private Long policyId;
    
}