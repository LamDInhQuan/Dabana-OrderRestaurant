package com.dabana.backend.modules.reservation_policy.service;

import com.dabana.backend.exception.BusinessException;
import com.dabana.backend.modules.branch2.entity.Branch;
import com.dabana.backend.modules.branch2.repository.BranchRepository;
import com.dabana.backend.modules.branch2.util.BranchErrorCode;
import com.dabana.backend.modules.reservation_policy.dto.request.CreateBranchPolicyScheduleRequest;
import com.dabana.backend.modules.reservation_policy.dto.request.UpdateBranchPolicyScheduleRequest;
import com.dabana.backend.modules.reservation_policy.dto.response.BranchPolicyScheduleResponse;
import com.dabana.backend.modules.reservation_policy.entity.BranchPolicy;
import com.dabana.backend.modules.reservation_policy.entity.BranchPolicySchedule;
import com.dabana.backend.modules.reservation_policy.mapper.BranchPolicyScheduleMapper;
import com.dabana.backend.modules.reservation_policy.repository.BranchPolicyRepository;
import com.dabana.backend.modules.reservation_policy.repository.BranchPolicyScheduleRepository;
import com.dabana.backend.modules.reservation_policy.util.PolicyErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class BranchPolicyScheduleService implements IBranchPolicyScheduleService {

    private final BranchRepository branchRepository;
    private final BranchPolicyRepository branchPolicyRepository;
    private final BranchPolicyScheduleRepository branchPolicyScheduleRepository;
    private final BranchPolicyScheduleMapper branchPolicyScheduleMapper;

    @Override
    @Transactional
    public BranchPolicyScheduleResponse create(Long branchId, Long policyId, CreateBranchPolicyScheduleRequest request) {
        branchRepository.findById(branchId)
                .orElseThrow(() -> new BusinessException(BranchErrorCode.BRANCH_NOT_FOUND));

        BranchPolicy branchPolicy = branchPolicyRepository.findByBranchIdAndPolicyId(branchId, policyId)
                .orElseThrow(() -> new BusinessException(PolicyErrorCode.BRANCH_POLICY_NOT_FOUND));

        validateSchedule(request);
        assertNoScheduleOverlap(branchPolicy.getId(), request.getStartDatetime(), request.getEndDatetime(), request.getPriority(), null);

        BranchPolicySchedule entity = branchPolicyScheduleMapper.toEntity(request, branchPolicy);
        return branchPolicyScheduleMapper.toResponse(branchPolicyScheduleRepository.save(entity));
    }

    @Override
    @Transactional
    public BranchPolicyScheduleResponse update(Long branchId, Long policyId, Long scheduleId, UpdateBranchPolicyScheduleRequest request) {
        branchRepository.findById(branchId)
                .orElseThrow(() -> new BusinessException(BranchErrorCode.BRANCH_NOT_FOUND));

        BranchPolicy branchPolicy = branchPolicyRepository.findByBranchIdAndPolicyId(branchId, policyId)
                .orElseThrow(() -> new BusinessException(PolicyErrorCode.BRANCH_POLICY_NOT_FOUND));

        BranchPolicySchedule entity = branchPolicyScheduleRepository.findByIdAndBranchPolicyId(scheduleId, branchPolicy.getId())
                .orElseThrow(() -> new BusinessException(PolicyErrorCode.SCHEDULE_NOT_FOUND));

        validateSchedule(request);
        assertNoScheduleOverlap(branchPolicy.getId(), request.getStartDatetime(), request.getEndDatetime(), request.getPriority(), scheduleId);

        entity.setName(request.getName().trim());
        entity.setDescription(request.getDescription());
        entity.setStartDatetime(request.getStartDatetime());
        entity.setEndDatetime(request.getEndDatetime());
        entity.setPriority(request.getPriority());
        entity.setStatus(request.getStatus());

        return branchPolicyScheduleMapper.toResponse(branchPolicyScheduleRepository.save(entity));
    }

    @Override
    @Transactional
    public void delete(Long branchId, Long policyId, Long scheduleId) {
        branchRepository.findById(branchId)
                .orElseThrow(() -> new BusinessException(BranchErrorCode.BRANCH_NOT_FOUND));

        BranchPolicy branchPolicy = branchPolicyRepository.findByBranchIdAndPolicyId(branchId, policyId)
                .orElseThrow(() -> new BusinessException(PolicyErrorCode.BRANCH_POLICY_NOT_FOUND));

        BranchPolicySchedule entity = branchPolicyScheduleRepository.findByIdAndBranchPolicyId(scheduleId, branchPolicy.getId())
                .orElseThrow(() -> new BusinessException(PolicyErrorCode.SCHEDULE_NOT_FOUND));

        branchPolicyScheduleRepository.delete(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public BranchPolicyScheduleResponse getDetail(Long branchId, Long policyId, Long scheduleId) {
        branchRepository.findById(branchId)
                .orElseThrow(() -> new BusinessException(BranchErrorCode.BRANCH_NOT_FOUND));

        BranchPolicy branchPolicy = branchPolicyRepository.findByBranchIdAndPolicyId(branchId, policyId)
                .orElseThrow(() -> new BusinessException(PolicyErrorCode.BRANCH_POLICY_NOT_FOUND));

        BranchPolicySchedule entity = branchPolicyScheduleRepository.findByIdAndBranchPolicyId(scheduleId, branchPolicy.getId())
                .orElseThrow(() -> new BusinessException(PolicyErrorCode.SCHEDULE_NOT_FOUND));

        return branchPolicyScheduleMapper.toResponse(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BranchPolicyScheduleResponse> getAll(Long branchId, Long policyId) {
        branchRepository.findById(branchId)
                .orElseThrow(() -> new BusinessException(BranchErrorCode.BRANCH_NOT_FOUND));

        BranchPolicy branchPolicy = branchPolicyRepository.findByBranchIdAndPolicyId(branchId, policyId)
                .orElseThrow(() -> new BusinessException(PolicyErrorCode.BRANCH_POLICY_NOT_FOUND));

        return branchPolicyScheduleRepository.findAllByBranchPolicyIdOrderByPriorityDesc(branchPolicy.getId())
                .stream()
                .map(branchPolicyScheduleMapper::toResponse)
                .toList();
    }

    private void validateSchedule(CreateBranchPolicyScheduleRequest request) {
        if (request.getStartDatetime() == null || request.getEndDatetime() == null || !request.getStartDatetime().isBefore(request.getEndDatetime())) {
            throw new BusinessException(PolicyErrorCode.INVALID_SCHEDULE);
        }
    }

    private void validateSchedule(UpdateBranchPolicyScheduleRequest request) {
        if (request.getStartDatetime() == null || request.getEndDatetime() == null || !request.getStartDatetime().isBefore(request.getEndDatetime())) {
            throw new BusinessException(PolicyErrorCode.INVALID_SCHEDULE);
        }
    }

    private void assertNoScheduleOverlap(Long branchPolicyId, LocalDateTime startDatetime, LocalDateTime endDatetime, Integer priority, Long excludeId) {
        List<BranchPolicySchedule> existingSchedules = branchPolicyScheduleRepository.findAllByBranchPolicyIdOrderByPriorityDesc(branchPolicyId);

        for (BranchPolicySchedule existing : existingSchedules) {
            if (excludeId != null && existing.getId().equals(excludeId)) {
                continue;
            }
            if (existing.getPriority().equals(priority) && startDatetime.isBefore(existing.getEndDatetime()) && existing.getStartDatetime().isBefore(endDatetime)) {
                throw new BusinessException(PolicyErrorCode.INVALID_SCHEDULE);
            }
        }
    }
}
