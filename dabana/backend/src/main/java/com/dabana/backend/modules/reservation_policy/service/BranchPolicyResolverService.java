package com.dabana.backend.modules.reservation_policy.service;

import com.dabana.backend.exception.BusinessException;
import com.dabana.backend.modules.booking.BookingStatus;
import com.dabana.backend.modules.branch2.repository.BranchRepository;
import com.dabana.backend.modules.reservation_policy.dto.DepositResult;
import com.dabana.backend.modules.reservation_policy.dto.response.BranchPolicyDetailResponse;
import com.dabana.backend.modules.reservation_policy.entity.BranchPolicy;
import com.dabana.backend.modules.reservation_policy.entity.BranchPolicyDepositRule;
import com.dabana.backend.modules.reservation_policy.entity.BranchPolicySchedule;
import com.dabana.backend.modules.reservation_policy.mapper.BranchPolicyMapper;
import com.dabana.backend.modules.reservation_policy.repository.BranchPolicyRepository;
import com.dabana.backend.modules.reservation_policy.util.PolicyErrorCode;
import com.dabana.backend.modules.reservation_policy.util.PolicyStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BranchPolicyResolverService implements IBranchPolicyResolver {

    private final BranchPolicyRepository branchPolicyRepository;
    private final BranchPolicyMapper branchPolicyMapper;

    @Override
    public BranchPolicyDetailResponse getActivePolicy(Long branchId, LocalDateTime reservationTime) {
        return branchPolicyMapper.toDetailResponse(resolve(branchId, reservationTime));
    }

    @Override
    public BranchPolicy resolve(Long branchId, LocalDateTime reservationTime) {
        List<BranchPolicy> policies = branchPolicyRepository.findActivePolicies(branchId, PolicyStatus.ACTIVE);
        return policies.stream()
                .filter(policy -> match(policy, reservationTime))
                .max(Comparator.comparingInt(BranchPolicy::getPriority))
                .orElseThrow(() -> new BusinessException(PolicyErrorCode.POLICY_NOT_FOUND));
    }

    @Override
    public DepositResult calculate(BranchPolicy policy, Integer guestCount) {
        if (policy.getDepositRules() == null || policy.getDepositRules().isEmpty()) {
            throw new BusinessException(PolicyErrorCode.DEPOSIT_RULE_NOT_FOUND);
        }
        BranchPolicyDepositRule rule = policy.getDepositRules()
                .stream()
                .filter(r ->
                        guestCount >= r.getMinGuest() && guestCount <= r.getMaxGuest())
                .findFirst()
                .orElseThrow(() -> new BusinessException(PolicyErrorCode.INVALID_DEPOSIT_RULE));

        BigDecimal depositAmount;
        switch (rule.getDepositType()) {
            case FIXED:
                depositAmount = rule.getDepositValue();
                break;
            case PER_PERSON:
                depositAmount = rule.getDepositValue().multiply(BigDecimal.valueOf(guestCount));
                break;
            default:
                throw new BusinessException(PolicyErrorCode.INVALID_DEPOSIT_RULE);
        }

        return new DepositResult(rule, depositAmount);
    }

    private boolean match(BranchPolicy policy, LocalDateTime reservationTime) {
        if (policy.getSchedules() == null || policy.getSchedules().isEmpty()) {
            return false;
        }
        return policy.getSchedules()
                .stream()
                .anyMatch(schedule ->
                        matchSchedule(schedule, reservationTime));
    }

    private boolean matchSchedule(BranchPolicySchedule schedule, LocalDateTime reservationTime) {
        switch (schedule.getBranchPolicy().getPolicy().getScheduleType()) {
            case ALWAYS:
                return true;
            case DAY_OF_WEEK:
                return schedule.getDayOfWeek() == reservationTime.getDayOfWeek().getValue();
            case DATE_RANGE:
                LocalDate date = reservationTime.toLocalDate();
                return !date.isBefore(schedule.getDateFrom()) && !date.isAfter(schedule.getDateTo());
            default:
                return false;
        }
    }
}
