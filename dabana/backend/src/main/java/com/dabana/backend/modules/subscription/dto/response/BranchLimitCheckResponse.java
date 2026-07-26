package com.dabana.backend.modules.subscription.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
@AllArgsConstructor
public class BranchLimitCheckResponse {
    private boolean allowed;
    private long currentBranchCount;
    private Integer maxBranchesSnapshot;
    private String message;
}
