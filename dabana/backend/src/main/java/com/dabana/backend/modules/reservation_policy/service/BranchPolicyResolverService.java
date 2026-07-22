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
import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class BranchPolicyResolverService implements IBranchPolicyResolver {

    private final BranchPolicyRepository branchPolicyRepository;
    private final BranchPolicyMapper branchPolicyMapper;
    private final ReservationPolicyDepositRuleRepository reservationPolicyDepositRuleRepository;

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
    public DepositResult calculate(BranchPolicy policy, Integer guestCount ,LocalDateTime reservationTime) {
        BigDecimal depositAmount;
        if (!isReservationTimeInActiveWindow(policy, reservationTime)) {
            return createFreeDepositResult(policy);
        }
        // 1. Kiểm tra xem BranchPolicy có danh sách rule riêng hay không
        boolean hasBranchRules = policy.getDepositRules() != null && !policy.getDepositRules().isEmpty();

        if (hasBranchRules) {
            // Tìm Rule khớp với số lượng khách
            BranchPolicyDepositRule branchRule = policy.getDepositRules().stream()
                    .filter(r -> guestCount >= r.getMinGuest() && guestCount <= r.getMaxGuest())
                    .findFirst()
                    .orElse(null);

            // CASE A: Chi nhánh có rule và TÌM THẤY rule khớp số khách -> Tính tiền cọc
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

            // CASE B: Chi nhánh CÓ cấu hình rule cho khung giờ này, nhưng số khách KHÔNG RƠI VÀO KHU VỰC BẮT CỌC
            // -> Nghĩa là khung giờ/số khách này ĐƯỢC MIỄN CỌC (0đ), KHÔNG fallback về hệ thống!
            return createFreeDepositResult(policy);
        }

        // 2. FALLBACK CHỈ KHI: Chi nhánh HOÀN TOÀN KHÔNG CÓ rule nào (Dùng cấu hình mặc định của hệ thống)
        Optional<ReservationPolicyDepositRule> defaultRuleOpt = reservationPolicyDepositRuleRepository
                .findFirstByPolicyIdAndMinGuestLessThanEqualAndMaxGuestGreaterThanEqual(
                        policy.getPolicy().getId(), guestCount, guestCount
                );

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
            BranchPolicyDepositRule branchRule = new BranchPolicyDepositRule();
            branchRule.setDepositType(defaultRule.getDepositType());
            branchRule.setDepositValue(defaultRule.getDepositValue());
            branchRule.setMinGuest(defaultRule.getMinGuest());
            branchRule.setMaxGuest(defaultRule.getMaxGuest());
            branchRule.setBranchPolicy(policy);
            return new DepositResult(branchRule, depositAmount);
        }
        // 3. Không tìm thấy ở đâu -> Miễn phí cọc
        return createFreeDepositResult(policy);
    }

    private boolean isReservationTimeInActiveWindow(BranchPolicy policy, LocalDateTime reservationTime) {
        // Nếu policy không có bất kỳ schedule nào, ta coi như nó áp dụng All-day (toàn thời gian)
        if (policy.getSchedules() == null || policy.getSchedules().isEmpty()) {
            return true;
        }

        LocalDate reqDate = reservationTime.toLocalDate();
        LocalTime reqTime = reservationTime.toLocalTime();

        // DayOfWeek trong Java: 1 = Monday (Thứ 2) ... 7 = Sunday (Chủ Nhật)
        // Hãy đảm bảo column day_of_week trong DB của bạn map đúng logic này (nhìn ảnh số 6, 7 có vẻ đúng là T7, CN)
        int reqDayOfWeek = reservationTime.getDayOfWeek().getValue();

        // Duyệt qua từng schedule, nếu THỎA MÃN ÍT NHẤT 1 SCHEDULE ACTIVE -> Có hiệu lực
        for (BranchPolicySchedule schedule : policy.getSchedules()) {
            // Bỏ qua nếu schedule không ACTIVE
            // (Giả sử bạn dùng Enum Status hoặc String, hãy điều chỉnh cho đúng)
            if (schedule.getStatus() == null || !"ACTIVE".equalsIgnoreCase(schedule.getStatus().name())) {
                continue;
            }

            boolean matchDate = true;
            boolean matchDayOfWeek = true;
            boolean matchTime = true;

            // 1. Kiểm tra Ngày (Date Range - vd Lễ Tết 28/01 - 05/02)
            if (schedule.getDateFrom() != null && schedule.getDateTo() != null) {
                // dateFrom <= reqDate <= dateTo
                matchDate = !reqDate.isBefore(schedule.getDateFrom()) && !reqDate.isAfter(schedule.getDateTo());
            }
            // 2. Kiểm tra Thứ trong tuần (Day of Week - vd Thứ 7, CN)
            if (schedule.getDayOfWeek() != null) {
                matchDayOfWeek = (schedule.getDayOfWeek() == reqDayOfWeek);
            }
            // 3. Kiểm tra Giờ (Time Range - vd 18:00 đến 23:00)
            if (schedule.getTimeFrom() != null && schedule.getTimeTo() != null) {
                LocalTime startTime = schedule.getTimeFrom();
                LocalTime endTime = schedule.getTimeTo();

                if (startTime.isBefore(endTime)) {
                    // Giờ trong ngày (VD: 08:00 - 21:00)
                    matchTime = !reqTime.isBefore(startTime) && !reqTime.isAfter(endTime);
                } else {
                    // Xử lý qua đêm (VD: 22:00 - 02:00 sáng hôm sau)
                    matchTime = !reqTime.isBefore(startTime) || !reqTime.isAfter(endTime);
                }
            }
            // Nếu tất cả các điều kiện (được set) của schedule này đều đúng
            if (matchDate && matchDayOfWeek && matchTime) {
                return true; // Thoát ngay, xác nhận khung giờ này CÓ hiệu lực!
            }
        }
        // Sau khi duyệt hết tất cả schedules mà không có cái nào khớp -> Nằm ngoài khung giờ hiệu lực
        return false;
    }
    private DepositResult createFreeDepositResult(BranchPolicy policy) {
        BranchPolicyDepositRule emptyRule = new BranchPolicyDepositRule();
        emptyRule.setDepositType(DepositType.FIXED);
        emptyRule.setDepositValue(BigDecimal.ZERO);
        emptyRule.setMinGuest(0);
        emptyRule.setMaxGuest(999);
        emptyRule.setBranchPolicy(policy);
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
