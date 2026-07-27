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
import java.math.RoundingMode;
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
    public DepositResult calculate(BranchPolicy policy, Integer guestCount, LocalDateTime reservationTime, BigDecimal totalPreorderAmount) {
        if (!isReservationTimeInActiveWindow(policy, reservationTime)) {
            return createFreeDepositResult(policy);
        }
        BigDecimal preorderAmount = totalPreorderAmount != null ? totalPreorderAmount : BigDecimal.ZERO;
        List<BranchPolicyDepositRule> rules = policy.getDepositRules().stream().toList();

        // 2. Tìm Rule phù hợp với số lượng khách (xử lý cả trường hợp maxGuest null = vô tận)
        if (rules != null && !rules.isEmpty()) {
            BranchPolicyDepositRule matchedRule = rules.stream()
                    .filter(r -> guestCount >= r.getMinGuest() && guestCount <= r.getMaxGuest())
                    .findFirst()
                    .orElse(null);

            if (matchedRule != null) {
                BigDecimal depositAmount = calculateDepositAmount(
                        matchedRule.getDepositType(),
                        matchedRule.getDepositValue(),
                        matchedRule.getMinPreorderAmount(),
                        guestCount,
                        preorderAmount
                );
                return new DepositResult(matchedRule, depositAmount);
            }

            // Nằm ngoài dải số khách đã cấu hình -> Ném lỗi yêu cầu liên hệ nhà hàng
            throw new BusinessException(PolicyErrorCode.GUEST_COUNT_OUT_OF_POLICY_RANGE);
        }
        // 3. Không tìm thấy ở đâu -> Miễn phí cọc
        return createFreeDepositResult(policy);
    }

    private boolean isReservationTimeInActiveWindow(BranchPolicy policy, LocalDateTime reservationTime) {
        // Nếu policy không có bất kỳ schedule nào, ta coi như nó áp dụng All-day (toàn thời gian)
        if (policy.getSchedules() == null || policy.getSchedules().isEmpty()) {
            throw new BusinessException(PolicyErrorCode.SCHEDULE_NOT_FOUND); // throw exception luôn
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

    private BigDecimal calculateDepositAmount(DepositType depositType, BigDecimal depositValue, BigDecimal minPreorderAmount, int guestCount, BigDecimal preorderAmount) {
        return switch (depositType) {
            case FIXED -> depositValue;
            case PER_PERSON -> depositValue.multiply(BigDecimal.valueOf(guestCount));
            case PERCENTAGE -> {
                // Kiểm tra ngưỡng món đặt trước tối thiểu
                // yield: Trả về giá trị cho riêng biểu thức switch đó , đó, sau đó code vẫn tiếp tục chạy các dòng tiếp theo bên dưới khối switch (nếu có).
                if (minPreorderAmount != null && preorderAmount.compareTo(minPreorderAmount) < 0) {
                    yield BigDecimal.ZERO;
                }
                yield preorderAmount.multiply(depositValue).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            }
        };
    }

    private DepositResult createFreeDepositResult(BranchPolicy policy) {
        return new DepositResult(null, BigDecimal.ZERO);
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
