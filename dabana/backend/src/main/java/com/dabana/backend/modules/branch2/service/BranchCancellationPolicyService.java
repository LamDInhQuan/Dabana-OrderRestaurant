package com.dabana.backend.modules.branch2.service;

import com.dabana.backend.exception.BusinessException;
import com.dabana.backend.modules.branch2.dto.request.BranchCancellationPolicyRequest;
import com.dabana.backend.modules.branch2.dto.response.BranchCancellationPolicyResponse;
import com.dabana.backend.modules.branch2.entity.Branch;
import com.dabana.backend.modules.branch2.entity.BranchCancellationPolicy;
import com.dabana.backend.modules.branch2.mapper.BranchCancellationPolicyMapper;
import com.dabana.backend.modules.branch2.repository.BranchCancellationPolicyRepository;
import com.dabana.backend.modules.branch2.repository.BranchRepository;
import com.dabana.backend.modules.branch2.util.BranchCancellationPolicyErrorCode;
import com.dabana.backend.modules.branch2.util.BranchCancellationPolicyStatus;
import com.dabana.backend.modules.branch2.util.BranchErrorCode;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Transactional
public class BranchCancellationPolicyService
        implements IBranchCancellationPolicyService {

    private final BranchRepository branchRepository;
    private final BranchCancellationPolicyRepository repository;
    private final BranchCancellationPolicyMapper mapper;

    @Override
    public BranchCancellationPolicyResponse create(
            Long branchId,
            BranchCancellationPolicyRequest request) {

        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() ->
                        new BusinessException(BranchErrorCode.BRANCH_NOT_FOUND));

        if (repository.existsByBranchId(branchId)) {
            throw new BusinessException(BranchCancellationPolicyErrorCode.POLICY_ALREADY_EXISTS);
        }

        BranchCancellationPolicy entity = mapper.toEntity(request);

        entity.setBranch(branch);
        entity.setStatus(BranchCancellationPolicyStatus.ACTIVE);

        repository.save(entity);

        return mapper.toResponse(entity);
    }

    @Override
    public BranchCancellationPolicyResponse update(
            Long branchId,
            BranchCancellationPolicyRequest request) {

        BranchCancellationPolicy entity = loadByBranch(branchId);

        mapper.update(entity, request);

        repository.save(entity);

        return mapper.toResponse(entity);
    }

    @Override
    public BranchCancellationPolicyResponse getByBranch(Long branchId) {
        return mapper.toResponse(loadByBranch(branchId));
    }

    @Override
    public BranchCancellationPolicy loadByBranch(Long branchId) {
        return repository.findByBranchId(branchId)
                .orElseThrow(() ->
                        new BusinessException(BranchCancellationPolicyErrorCode.POLICY_NOT_FOUND));
    }
}