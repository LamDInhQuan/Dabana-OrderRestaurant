package com.dabana.backend.modules.reservation_policy.service;

import com.dabana.backend.modules.reservation_policy.dto.DepositResult;
import com.dabana.backend.modules.reservation_policy.dto.response.BranchPolicyDetailResponse;
import com.dabana.backend.modules.reservation_policy.entity.BranchPolicy;

import java.time.LocalDateTime;

public interface IBranchPolicyResolver {
    BranchPolicyDetailResponse getActivePolicy(Long branchId, LocalDateTime reservationTime);

    BranchPolicy resolve(
            Long branchId,
            LocalDateTime reservationTime
    );

    DepositResult calculate(
            BranchPolicy policy,
            Integer guestCount ,
            LocalDateTime reservationTime
    );
}
