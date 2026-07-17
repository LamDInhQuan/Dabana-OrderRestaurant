package com.dabana.backend.modules.reservation_policy.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class ReservationPolicySummaryResponse {

    private Long id;

    private String policyCode;

    private String name;

    private String description;

}