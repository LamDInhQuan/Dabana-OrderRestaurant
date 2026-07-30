package com.dabana.backend.modules.report.partner.util;

import com.dabana.backend.modules.branch2.entity.Branch;
import com.dabana.backend.modules.branch2.repository.BranchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Giai quyet danh sach branch_id ma chu nha hang (owner) duoc phep xem bao cao.
 * branchId != null nhung khong thuoc owner => 403 (AccessDeniedException).
 * branchId == null => tat ca branch cua owner.
 */
@Component
@RequiredArgsConstructor
public class PartnerBranchAccessGuard {

    private final BranchRepository branchRepository;

    public List<Long> resolveAccessibleBranchIds(Long ownerId, Long requestedBranchId) {
        List<Long> ownerBranchIds = branchRepository.findByRestaurant_Owner_Id(ownerId)
                .stream()
                .map(Branch::getId)
                .toList();

        if (requestedBranchId == null) {
            return ownerBranchIds;
        }
        if (!ownerBranchIds.contains(requestedBranchId)) {
            throw new AccessDeniedException("Branch " + requestedBranchId + " khong thuoc quyen quan ly cua ban");
        }
        return List.of(requestedBranchId);
    }
}
