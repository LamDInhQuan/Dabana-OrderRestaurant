package com.dabana.backend.modules.reservation_policy.dto.response;

import com.dabana.backend.modules.reservation_policy.util.PolicyScheduleType;
import com.dabana.backend.modules.reservation_policy.util.PolicyStatus;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class ReservationPolicyResponse {

    private Long id;

    private String policyCode;

    private String name;

    @JsonProperty("isDefault")
    private Boolean defaultPolicy;

    private PolicyStatus status;

    private PolicyScheduleType policyScheduleType ;
}