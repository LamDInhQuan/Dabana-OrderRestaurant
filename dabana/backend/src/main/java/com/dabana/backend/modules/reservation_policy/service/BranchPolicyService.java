package com.dabana.backend.modules.reservation_policy.service;

import com.dabana.backend.exception.BusinessException;
import com.dabana.backend.modules.branch2.entity.Branch;
import com.dabana.backend.modules.branch2.repository.BranchRepository;
import com.dabana.backend.modules.branch2.util.BranchErrorCode;
import com.dabana.backend.modules.reservation_policy.dto.request.AssignBranchPolicyRequest;
import com.dabana.backend.modules.reservation_policy.dto.request.UpdateBranchPolicyRequest;
import com.dabana.backend.modules.reservation_policy.dto.response.BranchPolicyDetailResponse;
import com.dabana.backend.modules.reservation_policy.dto.response.BranchPolicyResponse;
import com.dabana.backend.modules.reservation_policy.entity.BranchPolicy;
import com.dabana.backend.modules.reservation_policy.entity.ReservationPolicy;
import com.dabana.backend.modules.reservation_policy.mapper.BranchPolicyMapper;
import com.dabana.backend.modules.reservation_policy.repository.BranchPolicyRepository;
import com.dabana.backend.modules.reservation_policy.repository.ReservationPolicyRepository;
import com.dabana.backend.modules.reservation_policy.util.PolicyErrorCode;
import com.dabana.backend.modules.reservation_policy.util.PolicyStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class BranchPolicyService implements IBranchPolicyService {

    private final BranchPolicyRepository branchPolicyRepository;
    private final BranchRepository branchRepository;
    private final ReservationPolicyRepository reservationPolicyRepository;
    private final BranchPolicyMapper branchPolicyMapper;

    @Override
    @Transactional
    public BranchPolicyResponse create(Long branchId, AssignBranchPolicyRequest request) {
        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new BusinessException(BranchErrorCode.BRANCH_NOT_FOUND));

        ReservationPolicy policy = reservationPolicyRepository.findById(request.getPolicyId())
                .orElseThrow(() -> new BusinessException(PolicyErrorCode.POLICY_NOT_FOUND));

        if (!branch.getRestaurant().getId().equals(policy.getRestaurant().getId())) {
            throw new BusinessException(PolicyErrorCode.INVALID_POLICY_ASSIGNMENT);
        }

        boolean exists = branchPolicyRepository.existsByBranchIdAndPolicyId(branchId, policy.getId());
        if (exists) {
            throw new BusinessException(PolicyErrorCode.BRANCH_POLICY_ALREADY_EXISTS);
        }

        BranchPolicy branchPolicy = branchPolicyMapper.toEntity(request, branch, policy);
        branchPolicy.setStatus(PolicyStatus.ACTIVE);

        BranchPolicy saved = branchPolicyRepository.save(branchPolicy);
        return branchPolicyMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public BranchPolicyResponse update(Long branchId, Long policyId, UpdateBranchPolicyRequest request) {
        BranchPolicy branchPolicy = branchPolicyRepository.findByBranchIdAndPolicyId(branchId, policyId)
                .orElseThrow(() -> new BusinessException(PolicyErrorCode.BRANCH_POLICY_NOT_FOUND));

        if (request.getPriority() != null) {
            branchPolicy.setPriority(request.getPriority());
        }
        if (request.getStatus() != null) {
            branchPolicy.setStatus(request.getStatus());
        }

        return branchPolicyMapper.toResponse(branchPolicyRepository.save(branchPolicy));
    }

    @Override
    @Transactional
    public void delete(Long branchId, Long policyId) {
        BranchPolicy branchPolicy = branchPolicyRepository.findByBranchIdAndPolicyId(branchId, policyId)
                .orElseThrow(() -> new BusinessException(PolicyErrorCode.BRANCH_POLICY_NOT_FOUND));

        branchPolicyRepository.delete(branchPolicy);
    }

    @Override
    @Transactional(readOnly = true)
    public BranchPolicyDetailResponse getDetail(
            Long branchId,
            Long branchPolicyId) {

        BranchPolicy branchPolicy =
                branchPolicyRepository.findDetailByIdAndBranchId(
                        branchPolicyId,
                        branchId
                ).orElseThrow(() ->
                        new BusinessException(
                                PolicyErrorCode.BRANCH_POLICY_NOT_FOUND));

        return branchPolicyMapper.toDetailResponse(branchPolicy);
    }
    @Override
    @Transactional(readOnly = true)
    public List<BranchPolicyResponse> getAll(Long branchId) {
        return branchPolicyRepository.findAllByBranchIdOrderByPriorityDesc(branchId)
                .stream()
                .map(branchPolicyMapper::toResponse)
                .toList();
    }
}
