package com.dabana.backend.modules.reservation_policy.dto.response;

import com.dabana.backend.modules.reservation_policy.util.PolicyScheduleType;
import com.dabana.backend.modules.reservation_policy.util.PolicyStatus;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
public class ReservationPolicyDetailResponse {

    private Long id;

    private String policyCode;

    private String name;

    private String description;

    private String termsAndConditions;

    @JsonProperty("isDefault")
    private Boolean defaultPolicy;

    private PolicyScheduleType scheduleType;

    private PolicyStatus status;

    private List<ReservationPolicyDepositRuleResponse> depositRules;

    private List<ReservationPolicyScheduleResponse> schedules;

}