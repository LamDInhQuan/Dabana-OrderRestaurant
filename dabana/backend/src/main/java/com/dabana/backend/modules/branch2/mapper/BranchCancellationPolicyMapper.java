package com.dabana.backend.modules.branch2.mapper;

import com.dabana.backend.modules.branch2.dto.request.BranchCancellationPolicyRequest;
import com.dabana.backend.modules.branch2.dto.response.BranchCancellationPolicyResponse;
import com.dabana.backend.modules.branch2.entity.BranchCancellationPolicy;
import com.dabana.backend.modules.branch2.util.BranchCancellationPolicyStatus;
import org.springframework.stereotype.Component;

@Component
public class BranchCancellationPolicyMapper {

    public BranchCancellationPolicy toEntity(
            BranchCancellationPolicyRequest request
    ) {
        BranchCancellationPolicy entity = new BranchCancellationPolicy();

        entity.setFreeCancellationHours(request.getFreeCancellationHours());
        entity.setLateCancellationRefundPercent(request.getLateCancellationRefundPercent());
        entity.setNoShowRefundPercent(request.getNoShowRefundPercent());
        entity.setFreeCancellationRefundPercent(
                request.getFreeCancellationRefundPercent()
        );
        // Mặc định Active khi tạo mới
        entity.setStatus(BranchCancellationPolicyStatus.ACTIVE);

        return entity;
    }

    public void update(
            BranchCancellationPolicy entity,
            BranchCancellationPolicyRequest request
    ) {
        entity.setFreeCancellationHours(request.getFreeCancellationHours());
        entity.setLateCancellationRefundPercent(request.getLateCancellationRefundPercent());
        entity.setNoShowRefundPercent(request.getNoShowRefundPercent());
        entity.setFreeCancellationRefundPercent(
                request.getFreeCancellationRefundPercent()
        );
        // Nếu request có status thì mở dòng dưới
        // entity.setStatus(request.getStatus());
    }

    public BranchCancellationPolicyResponse toResponse(
            BranchCancellationPolicy entity
    ) {
        return BranchCancellationPolicyResponse.builder()
                .id(entity.getId())
                .branchId(entity.getBranch().getId())
                .freeCancellationHours(entity.getFreeCancellationHours())
                .lateCancellationRefundPercent(entity.getLateCancellationRefundPercent())
                .noShowRefundPercent(entity.getNoShowRefundPercent())
                .freeCancellationRefundPercent(
                        entity.getFreeCancellationRefundPercent()
                )
                .status(entity.getStatus().name())
                .build();
    }
}