package com.dabana.backend.modules.reservation_policy.service;

import com.dabana.backend.exception.BusinessException;
import com.dabana.backend.modules.branch2.entity.Branch;
import com.dabana.backend.modules.branch2.repository.BranchRepository;
import com.dabana.backend.modules.branch2.util.BranchErrorCode;
import com.dabana.backend.modules.reservation_policy.dto.request.CreateBranchPolicyDepositRuleRequest;
import com.dabana.backend.modules.reservation_policy.dto.request.UpdateBranchPolicyDepositRuleRequest;
import com.dabana.backend.modules.reservation_policy.dto.response.BranchPolicyDepositRuleResponse;
import com.dabana.backend.modules.reservation_policy.entity.BranchPolicy;
import com.dabana.backend.modules.reservation_policy.entity.BranchPolicyDepositRule;
import com.dabana.backend.modules.reservation_policy.mapper.BranchPolicyDepositRuleMapper;
import com.dabana.backend.modules.reservation_policy.repository.BranchPolicyDepositRuleRepository;
import com.dabana.backend.modules.reservation_policy.repository.BranchPolicyRepository;
import com.dabana.backend.modules.reservation_policy.repository.ReservationPolicyRepository;
import com.dabana.backend.modules.reservation_policy.util.PolicyErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class BranchPolicyDepositRuleService implements IBranchPolicyDepositRuleService {

    private final BranchRepository branchRepository;
    private final BranchPolicyRepository branchPolicyRepository;
    private final ReservationPolicyRepository reservationPolicyRepository;
    private final BranchPolicyDepositRuleRepository branchPolicyDepositRuleRepository;
    private final BranchPolicyDepositRuleMapper branchPolicyDepositRuleMapper;

    @Override
    @Transactional
    public BranchPolicyDepositRuleResponse create(Long branchId, Long branchPolicyId, CreateBranchPolicyDepositRuleRequest request) {
        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new BusinessException(BranchErrorCode.BRANCH_NOT_FOUND));

        BranchPolicy branchPolicy = branchPolicyRepository.findById(branchPolicyId)
                .orElseThrow(() -> new BusinessException(PolicyErrorCode.BRANCH_POLICY_NOT_FOUND));

        validateRule(request);
        assertNoGuestRangeOverlap(branchPolicy.getId(), request.getMinGuests(), request.getMaxGuests(), null);

        BranchPolicyDepositRule entity = branchPolicyDepositRuleMapper.toEntity(request, branchPolicy);
        return branchPolicyDepositRuleMapper.toResponse(branchPolicyDepositRuleRepository.save(entity));
    }

    @Override
    @Transactional
    public BranchPolicyDepositRuleResponse update(Long branchId, Long branchPolicyId, Long ruleId, UpdateBranchPolicyDepositRuleRequest request) {
        branchRepository.findById(branchId)
                .orElseThrow(() -> new BusinessException(BranchErrorCode.BRANCH_NOT_FOUND));

        BranchPolicy branchPolicy = branchPolicyRepository.findById(branchPolicyId)
                .orElseThrow(() -> new BusinessException(PolicyErrorCode.BRANCH_POLICY_NOT_FOUND));


        BranchPolicyDepositRule entity = branchPolicyDepositRuleRepository.findByIdAndBranchPolicyId(ruleId, branchPolicy.getId())
                .orElseThrow(() -> new BusinessException(PolicyErrorCode.DEPOSIT_RULE_NOT_FOUND));

        validateRule(request);
        assertNoGuestRangeOverlap(branchPolicy.getId(), request.getMinGuests(), request.getMaxGuests(), ruleId);

        entity.setMinGuest(request.getMinGuests());
        entity.setMaxGuest(request.getMaxGuests());
        entity.setDepositType(request.getDepositType());
        entity.setDepositValue(request.getDepositValue());
        entity.setMaxTables(request.getMaxTables());
        entity.setMaxCapacitySlop(request.getMaxCapacitySlop() != null ? request.getMaxCapacitySlop() : 2);
        entity.setMinPreorderAmount(request.getMinPreorderAmount());
        entity.setPreorderDepositPercent(request.getPreorderDepositPercent());

        return branchPolicyDepositRuleMapper.toResponse(branchPolicyDepositRuleRepository.save(entity));
    }

    @Override
    @Transactional
    public void delete(Long branchId, Long branchPolicyId, Long ruleId) {
        branchRepository.findById(branchId)
                .orElseThrow(() -> new BusinessException(BranchErrorCode.BRANCH_NOT_FOUND));

        BranchPolicy branchPolicy = branchPolicyRepository.findById(branchPolicyId)
                .orElseThrow(() -> new BusinessException(PolicyErrorCode.BRANCH_POLICY_NOT_FOUND));

        BranchPolicyDepositRule entity = branchPolicyDepositRuleRepository.findByIdAndBranchPolicyId(ruleId, branchPolicy.getId())
                .orElseThrow(() -> new BusinessException(PolicyErrorCode.DEPOSIT_RULE_NOT_FOUND));

        branchPolicyDepositRuleRepository.delete(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public BranchPolicyDepositRuleResponse getDetail(Long branchId, Long policyId, Long ruleId) {
        branchRepository.findById(branchId)
                .orElseThrow(() -> new BusinessException(BranchErrorCode.BRANCH_NOT_FOUND));

        BranchPolicy branchPolicy = branchPolicyRepository.findByBranchIdAndPolicyId(branchId, policyId)
                .orElseThrow(() -> new BusinessException(PolicyErrorCode.BRANCH_POLICY_NOT_FOUND));

        BranchPolicyDepositRule entity = branchPolicyDepositRuleRepository.findByIdAndBranchPolicyId(ruleId, branchPolicy.getId())
                .orElseThrow(() -> new BusinessException(PolicyErrorCode.DEPOSIT_RULE_NOT_FOUND));

        return branchPolicyDepositRuleMapper.toResponse(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BranchPolicyDepositRuleResponse> getAll(Long branchId, Long policyId) {
        branchRepository.findById(branchId)
                .orElseThrow(() -> new BusinessException(BranchErrorCode.BRANCH_NOT_FOUND));

        BranchPolicy branchPolicy = branchPolicyRepository.findByBranchIdAndPolicyId(branchId, policyId)
                .orElseThrow(() -> new BusinessException(PolicyErrorCode.BRANCH_POLICY_NOT_FOUND));

        return branchPolicyDepositRuleRepository.findAllByBranchPolicyIdOrderByMinGuestAsc(branchPolicy.getId())
                .stream()
                .map(branchPolicyDepositRuleMapper::toResponse)
                .toList();
    }

    private void validateRule(CreateBranchPolicyDepositRuleRequest request) {
        validateRule(request.getMinGuests(), request.getMaxGuests(), request.getDepositValue());
    }

    private void validateRule(UpdateBranchPolicyDepositRuleRequest request) {
        validateRule(request.getMinGuests(), request.getMaxGuests(), request.getDepositValue());
    }

    private void validateRule(Integer minGuest, Integer maxGuest, BigDecimal depositValue) {
        if (minGuest == null || maxGuest == null || minGuest > maxGuest) {
            throw new BusinessException(PolicyErrorCode.INVALID_DEPOSIT_RULE);
        }
        if (depositValue == null || depositValue.compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessException(PolicyErrorCode.INVALID_DEPOSIT_RULE);
        }
    }

    private void assertNoGuestRangeOverlap(Long branchPolicyId, Integer minGuest, Integer maxGuest, Long excludeId) {
        List<BranchPolicyDepositRule> existingRules = branchPolicyDepositRuleRepository.findAllByBranchPolicyIdOrderByMinGuestAsc(branchPolicyId);

        for (BranchPolicyDepositRule existing : existingRules) {
            if (excludeId != null && existing.getId().equals(excludeId)) {
                continue;
            }
            if (minGuest <= existing.getMaxGuest() && existing.getMinGuest() <= maxGuest) {
                throw new BusinessException(PolicyErrorCode.INVALID_DEPOSIT_RULE);
            }
        }
    }
}
