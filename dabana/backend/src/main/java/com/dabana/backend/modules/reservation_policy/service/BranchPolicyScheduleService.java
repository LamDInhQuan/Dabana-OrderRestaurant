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
import com.dabana.backend.modules.reservation_policy.util.PolicyScheduleType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
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

        validateSchedule(branchPolicy.getPolicy().getScheduleType(), request);

        assertNoScheduleOverlap(
                branchPolicy.getId(),
                branchPolicy.getPolicy().getScheduleType(),
                request.getDayOfWeek(),
                request.getDateFrom(),
                request.getDateTo(),
                request.getTimeFrom(),
                request.getTimeTo(),
                null
        );

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

        validateSchedule(branchPolicy.getPolicy().getScheduleType(), request);

        assertNoScheduleOverlap(
                branchPolicy.getId(),
                branchPolicy.getPolicy().getScheduleType(),
                request.getDayOfWeek(),
                request.getDateFrom(),
                request.getDateTo(),
                request.getTimeFrom(),
                request.getTimeTo(),
                scheduleId
        );

        entity.setDayOfWeek(request.getDayOfWeek());
        entity.setDateFrom(request.getDateFrom());
        entity.setDateTo(request.getDateTo());
        entity.setTimeFrom(request.getTimeFrom());
        entity.setTimeTo(request.getTimeTo());
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

        return branchPolicyScheduleRepository
                .findAllByBranchPolicyIdOrderByIdAsc(branchPolicy.getId())
                .stream()
                .map(branchPolicyScheduleMapper::toResponse)
                .toList();
    }

    private void validateSchedule(
            PolicyScheduleType scheduleType,
            CreateBranchPolicyScheduleRequest request) {

        validateScheduleType(
                scheduleType,
                request.getDayOfWeek(),
                request.getDateFrom(),
                request.getDateTo(),
                request.getTimeFrom(),
                request.getTimeTo()
        );
    }

    private void validateSchedule(
            PolicyScheduleType scheduleType,
            UpdateBranchPolicyScheduleRequest request) {

        validateScheduleType(
                scheduleType,
                request.getDayOfWeek(),
                request.getDateFrom(),
                request.getDateTo(),
                request.getTimeFrom(),
                request.getTimeTo()
        );
    }

    private void validateScheduleType(
            PolicyScheduleType scheduleType,
            Integer dayOfWeek,
            LocalDate dateFrom,
            LocalDate dateTo,
            LocalTime timeFrom,
            LocalTime timeTo) {

        if (scheduleType == null) {
            throw new BusinessException(PolicyErrorCode.INVALID_SCHEDULE);
        }

        if (timeFrom != null && timeTo != null && !timeFrom.isBefore(timeTo)) {
            throw new BusinessException(PolicyErrorCode.INVALID_SCHEDULE);
        }

        switch (scheduleType) {

            case ALWAYS -> {
                if (dayOfWeek != null || dateFrom != null || dateTo != null) {
                    throw new BusinessException(PolicyErrorCode.INVALID_SCHEDULE);
                }
            }

            case DAY_OF_WEEK -> {
                if (dayOfWeek == null || dateFrom != null || dateTo != null) {
                    throw new BusinessException(PolicyErrorCode.INVALID_SCHEDULE);
                }
            }

            case DATE_RANGE -> {
                if (dateFrom == null
                        || dateTo == null
                        || dateFrom.isAfter(dateTo)
                        || dayOfWeek != null) {
                    throw new BusinessException(PolicyErrorCode.INVALID_SCHEDULE);
                }
            }

            default -> throw new BusinessException(PolicyErrorCode.INVALID_SCHEDULE);
        }
    }

    private void assertNoScheduleOverlap(
            Long branchPolicyId,
            PolicyScheduleType scheduleType,
            Integer dayOfWeek,
            LocalDate dateFrom,
            LocalDate dateTo,
            LocalTime timeFrom,
            LocalTime timeTo,
            Long excludeId) {

        List<BranchPolicySchedule> schedules =
                branchPolicyScheduleRepository.findAllByBranchPolicyIdOrderByIdAsc(branchPolicyId);
        for (BranchPolicySchedule existing : schedules) {
            if (excludeId != null && existing.getId().equals(excludeId)) {
                continue;
            }
            switch (scheduleType) {
                case ALWAYS -> {
                    throw new BusinessException(
                            PolicyErrorCode.ALWAYS_SCHEDULE_ALREADY_EXISTS);
                }
                case DAY_OF_WEEK -> {
                    if (!existing.getDayOfWeek().equals(dayOfWeek)) {
                        continue;
                    }
                    if (timeFrom == null || existing.getTimeFrom() == null) {
                        throw new BusinessException(
                                PolicyErrorCode.DAY_OF_WEEK_SCHEDULE_OVERLAPPED);
                    }
                    if (timeFrom.isBefore(existing.getTimeTo())
                            && existing.getTimeFrom().isBefore(timeTo)) {
                        throw new BusinessException(
                                PolicyErrorCode.DAY_OF_WEEK_SCHEDULE_OVERLAPPED);
                    }
                }
                case DATE_RANGE -> {
                    if (!dateFrom.isAfter(existing.getDateTo())
                            && !existing.getDateFrom().isAfter(dateTo)) {
                        throw new BusinessException(
                                PolicyErrorCode.DATE_RANGE_SCHEDULE_OVERLAPPED);
                    }
                }
            }
        }
    }
}
