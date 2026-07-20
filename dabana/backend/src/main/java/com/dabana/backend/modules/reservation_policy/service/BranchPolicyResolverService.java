package com.dabana.backend.modules.reservation_policy.service;

import com.dabana.backend.exception.BusinessException;
import com.dabana.backend.modules.booking.BookingStatus;
import com.dabana.backend.modules.branch2.repository.BranchRepository;
import com.dabana.backend.modules.reservation_policy.dto.DepositResult;
import com.dabana.backend.modules.reservation_policy.dto.response.BranchPolicyDetailResponse;
import com.dabana.backend.modules.reservation_policy.entity.BranchPolicy;
import com.dabana.backend.modules.reservation_policy.entity.BranchPolicyDepositRule;
import com.dabana.backend.modules.reservation_policy.entity.BranchPolicySchedule;
import com.dabana.backend.modules.reservation_policy.entity.ReservationPolicyDepositRule;
import com.dabana.backend.modules.reservation_policy.mapper.BranchPolicyMapper;
import com.dabana.backend.modules.reservation_policy.repository.BranchPolicyRepository;
import com.dabana.backend.modules.reservation_policy.repository.ReservationPolicyDepositRuleRepository;
import com.dabana.backend.modules.reservation_policy.repository.ReservationPolicyRepository;
import com.dabana.backend.modules.reservation_policy.util.DepositType;
import com.dabana.backend.modules.reservation_policy.util.PolicyErrorCode;
import com.dabana.backend.modules.reservation_policy.util.PolicyStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class BranchPolicyResolverService implements IBranchPolicyResolver {

    private final BranchPolicyRepository branchPolicyRepository;
    private final BranchPolicyMapper branchPolicyMapper;
    private final ReservationPolicyDepositRuleRepository reservationPolicyDepositRuleRepository ;

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
        BigDecimal depositAmount;

        // 1. Thử tìm Rule cụ thể đã được ghi đè tại Chi nhánh (Branch Level)
        BranchPolicyDepositRule branchRule = null;
        if (policy.getDepositRules() != null && !policy.getDepositRules().isEmpty()) {
            branchRule = policy.getDepositRules().stream()
                    .filter(r -> guestCount >= r.getMinGuest() && guestCount <= r.getMaxGuest())
                    .findFirst()
                    .orElse(null);
        }

        // 2. Nếu Chi nhánh CÓ cấu hình riêng -> Sử dụng cấu hình của Chi nhánh
        if (branchRule != null) {
            switch (branchRule.getDepositType()) {
                case FIXED:
                    depositAmount = branchRule.getDepositValue();
                    break;
                case PER_PERSON:
                    depositAmount = branchRule.getDepositValue().multiply(BigDecimal.valueOf(guestCount));
                    break;
                default:
                    throw new BusinessException(PolicyErrorCode.INVALID_DEPOSIT_RULE);
            }
            return new DepositResult(branchRule, depositAmount);
        }

        // 3. FALLBACK: Thử tìm Rule mặc định của hệ thống
        Optional<ReservationPolicyDepositRule> defaultRuleOpt = reservationPolicyDepositRuleRepository
                .findFirstByPolicyIdAndMinGuestLessThanEqualAndMaxGuestGreaterThanEqual(
                        policy.getPolicy().getId(), guestCount, guestCount
                );

        // 4. Nếu tìm thấy Rule mặc định -> Tính toán bình thường
        if (defaultRuleOpt.isPresent()) {
            ReservationPolicyDepositRule defaultRule = defaultRuleOpt.get();
            switch (defaultRule.getDepositType()) {
                case FIXED:
                    depositAmount = defaultRule.getDepositValue();
                    break;
                case PER_PERSON:
                    depositAmount = defaultRule.getDepositValue().multiply(BigDecimal.valueOf(guestCount));
                    break;
                default:
                    throw new BusinessException(PolicyErrorCode.INVALID_DEPOSIT_RULE);
            }
            branchRule.setId(defaultRule.getId()); // Giữ nguyên ID gốc hoặc set null tùy logic DB của bạn
            branchRule.setDepositType(defaultRule.getDepositType());
            branchRule.setDepositValue(defaultRule.getDepositValue());
            branchRule.setMinGuest(defaultRule.getMinGuest());
            branchRule.setMaxGuest(defaultRule.getMaxGuest());
            branchRule.setBranchPolicy(policy);
            return new DepositResult(branchRule, depositAmount);
        }

        // 5. CHỐT HẠ: Nếu cả 2 nơi đều không cấu hình -> Không cần cọc, cho tạo đơn luôn!
        // Trả về số tiền cọc = 0 và truyền null cho đối tượng Rule (FE/đơn hàng sẽ hiểu là miễn phí cọc)
        BranchPolicyDepositRule emptyRule = new BranchPolicyDepositRule();
        emptyRule.setDepositType(DepositType.FIXED); // Hoặc loại mặc định nào đó của bạn
        emptyRule.setDepositValue(BigDecimal.ZERO);
        emptyRule.setMinGuest(0);
        emptyRule.setMaxGuest(999);
        emptyRule.setBranchPolicy(policy); // 🌟 Gắn policy vào đây để tránh lỗi lúc gọi getBranchPolicy()
        return new DepositResult(emptyRule, BigDecimal.ZERO);
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
