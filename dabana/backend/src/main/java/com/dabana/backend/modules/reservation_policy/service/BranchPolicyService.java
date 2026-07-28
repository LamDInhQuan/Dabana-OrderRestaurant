package com.dabana.backend.modules.reservation_policy.service;

import com.dabana.backend.exception.BusinessException;
import com.dabana.backend.modules.branch2.entity.Branch;
import com.dabana.backend.modules.branch2.repository.BranchRepository;
import com.dabana.backend.modules.branch2.util.BranchErrorCode;
import com.dabana.backend.modules.reservation_policy.dto.request.AssignBranchPolicyRequest;
import com.dabana.backend.modules.reservation_policy.dto.request.UpdateBranchPolicyRequest;
import com.dabana.backend.modules.reservation_policy.dto.response.BranchPolicyDetailResponse;
import com.dabana.backend.modules.reservation_policy.dto.response.BranchPolicyResponse;
import com.dabana.backend.modules.reservation_policy.entity.*;
import com.dabana.backend.modules.reservation_policy.mapper.BranchPolicyMapper;
import com.dabana.backend.modules.reservation_policy.repository.BranchPolicyRepository;
import com.dabana.backend.modules.reservation_policy.repository.ReservationPolicyRepository;
import com.dabana.backend.modules.reservation_policy.util.PolicyErrorCode;
import com.dabana.backend.modules.reservation_policy.util.PolicyStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

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

        if (policy.getStatus() != PolicyStatus.ACTIVE) {
            throw new BusinessException(PolicyErrorCode.POLICY_NOT_ACTIVE);
        }

        if (!branch.getRestaurant().getId().equals(policy.getRestaurant().getId())) {
            throw new BusinessException(PolicyErrorCode.INVALID_POLICY_ASSIGNMENT);
        }

        // 🔴 CHECK BỔ SUNG: Template bắt buộc phải có ít nhất 1 Schedule và 1 Deposit Rule
        if (policy.getSchedules() == null || policy.getSchedules().isEmpty()) {
            throw new BusinessException(PolicyErrorCode.POLICY_SCHEDULE_EMPTY);
            // Báo lỗi: "Chính sách mẫu chưa được cấu hình lịch áp dụng. Vui lòng thiết lập lịch trước khi gán."
        }

        if (policy.getDepositRules() == null || policy.getDepositRules().isEmpty()) {
            throw new BusinessException(PolicyErrorCode.POLICY_DEPOSIT_RULE_EMPTY);
            // Báo lỗi: "Chính sách mẫu chưa được cấu hình quy tắc đặt cọc. Vui lòng thiết lập quy tắc cọc trước khi gán."
        }

        // --- Check xem Chi nhánh đã có Policy ACTIVE nào cùng loại ScheduleType chưa ---
        boolean existsActiveSameType = branchPolicyRepository.existsByBranchIdAndPolicyScheduleTypeAndStatus(
                branchId,
                policy.getScheduleType(),
                PolicyStatus.ACTIVE
        );

        if (existsActiveSameType) {
            throw new BusinessException(PolicyErrorCode.BRANCH_POLICY_TYPE_ALREADY_ACTIVE);
        }

        // Map Entity
        BranchPolicy branchPolicy = branchPolicyMapper.toEntity(request, branch, policy);
        branchPolicy.setStatus(PolicyStatus.ACTIVE);

        // Clone Deposit Rules sang Set của BranchPolicy
        for (ReservationPolicyDepositRule rule : policy.getDepositRules()) {
            branchPolicy.addDepositRule(BranchPolicyDepositRule.builder()
                    .minGuest(rule.getMinGuest())
                    .maxGuest(rule.getMaxGuest())
                    .depositType(rule.getDepositType())
                    .depositValue(rule.getDepositValue())
                    .maxTables(rule.getMaxTables())
                    .maxCapacitySlop(rule.getMaxCapacitySlop())
                    .minPreorderAmount(rule.getMinPreorderAmount())
                    .build());
        }

        // Clone Schedules sang Set của BranchPolicy
        for (ReservationPolicySchedule schedule : policy.getSchedules()) {
            branchPolicy.addSchedule(BranchPolicySchedule.builder()
                    .dayOfWeek(schedule.getDayOfWeek())
                    .dateFrom(schedule.getDateFrom())
                    .dateTo(schedule.getDateTo())
                    .timeFrom(schedule.getTimeFrom())
                    .timeTo(schedule.getTimeTo())
                    .status(schedule.getStatus())
                    .build());
        }

        BranchPolicy saved = branchPolicyRepository.save(branchPolicy);
        return branchPolicyMapper.toResponse(saved);
    }
    @Override
    @Transactional
    public BranchPolicyResponse update(Long branchId, Long policyId, UpdateBranchPolicyRequest request) {
        BranchPolicy branchPolicy = branchPolicyRepository.findByBranchIdAndPolicyId(branchId, policyId)
                .orElseThrow(() -> new BusinessException(PolicyErrorCode.BRANCH_POLICY_NOT_FOUND));

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
        return branchPolicyRepository.findAllByBranchId(branchId)
                .stream()
                .map(branchPolicyMapper::toResponse)
                .toList();
    }
}
