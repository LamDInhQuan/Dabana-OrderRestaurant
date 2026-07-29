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
                .max(Comparator.comparingInt(this::getPolicyPriorityRank))
                .orElseThrow(() -> new BusinessException(PolicyErrorCode.POLICY_NOT_FOUND));
    }

    @Override
    public DepositResult calculate(BranchPolicy policy, Integer guestCount, LocalDateTime reservationTime, BigDecimal totalPreorderAmount) {
        if (!isReservationTimeInActiveWindow(policy, reservationTime)) {
            return createFreeDepositResult(policy);
        }

        BigDecimal preorderAmount = totalPreorderAmount != null ? totalPreorderAmount : BigDecimal.ZERO;
        List<BranchPolicyDepositRule> rules = policy.getDepositRules().stream().toList();

        if (rules != null && !rules.isEmpty()) {
            // Sắp xếp các rule tăng dần theo minGuest để dễ xử lý logic khoảng và fallback
            List<BranchPolicyDepositRule> sortedRules = rules.stream()
                    .sorted(Comparator.comparingInt(BranchPolicyDepositRule::getMinGuest))
                    .toList();

            // 1. Kiểm tra trường hợp match chuẩn xác trước (min <= guestCount <= max)
            BranchPolicyDepositRule matchedRule = sortedRules.stream()
                    .filter(r -> guestCount >= r.getMinGuest() && (r.getMaxGuest() == null || guestCount <= r.getMaxGuest()))
                    .findFirst()
                    .orElse(null);

            // 2. Nếu vượt quá mốc lớn nhất (ví dụ: 9 khách mà mốc max chỉ là 8) -> Fallback lấy rule lớn nhất
            if (matchedRule == null && guestCount > sortedRules.get(sortedRules.size() - 1).getMinGuest()) {
                matchedRule = sortedRules.get(sortedRules.size() - 1);
            }

            // 3. Nếu không match chuẩn xác, tìm rule gần nhất phía dưới (minGuest <= guestCount)
            if (matchedRule == null) {
                matchedRule = sortedRules.stream()
                        .filter(r -> r.getMinGuest() <= guestCount)
                        .max(Comparator.comparingInt(BranchPolicyDepositRule::getMinGuest))
                        .orElse(null);
            }

            // 4. Nếu vẫn null (guestCount nhỏ hơn cả minGuest của rule nhỏ nhất) -> Lấy rule nhỏ nhất
            if (matchedRule == null) {
                matchedRule = sortedRules.get(0);
            }

            // 5. Tính toán tiền cọc dựa trên rule đã được resolve an toàn
            if (matchedRule != null) {
                BigDecimal depositAmount = calculateTotalDeposit(
                        matchedRule,
                        guestCount,
                        preorderAmount
                );
                return new DepositResult(matchedRule, depositAmount);
            }
        }

        // Không có rule nào -> Miễn phí cọc
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

    public BigDecimal calculateTotalDeposit(
            BranchPolicyDepositRule rule,
            int guestCount,
            BigDecimal preorderAmount) {

        // 1. Cọc cố định hoặc theo đầu người cho tiền bàn
        BigDecimal tableDeposit = switch (rule.getDepositType()) {
            case FIXED -> rule.getDepositValue();
            case PER_PERSON -> rule.getDepositValue().multiply(BigDecimal.valueOf(guestCount));
        };

        // 2. Cọc % tiền món ăn (nếu rule có quy định % và khách có chọn món)
        BigDecimal foodDeposit = BigDecimal.ZERO;

// 1. Kiểm tra nếu có cấu hình % cọc món và khách có đặt món (> 0đ)
        if (rule.getPreorderDepositPercent() != null
                && preorderAmount != null
                && preorderAmount.compareTo(BigDecimal.ZERO) > 0) {

            boolean isEligibleForPercentDeposit = false;

            if (rule.getMinPreorderAmount() == null) {
                // Trường hợp min null -> Luôn kích hoạt cọc % cho mọi giá trị đơn đặt món
                isEligibleForPercentDeposit = true;
            } else if (preorderAmount.compareTo(rule.getMinPreorderAmount()) >= 0) {
                // Trường hợp có min -> Bill món phải >= minPreorderAmount mới kích hoạt tính cọc %
                isEligibleForPercentDeposit = true;
            }

            // 2. Nếu thỏa mãn điều kiện kích hoạt -> Mới tính % cọc món trên tổng tiền bill đặt trước
            if (isEligibleForPercentDeposit) {
                foodDeposit = preorderAmount.multiply(rule.getPreorderDepositPercent())
                        .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            }
        }

        return tableDeposit.add(foodDeposit);
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

    private int getPolicyPriorityRank(BranchPolicy policy) {
        if (policy == null || policy.getPolicy().getScheduleType() == null) {
            return 0;
        }

        return switch (policy.getPolicy().getScheduleType()) {
            case DATE_RANGE -> 3; // Cao nhất: Áp dụng cho các dịp đặc biệt / khoảng ngày cụ thể
            case DAY_OF_WEEK -> 2; // Trung bình: Áp dụng cho thứ 2-CN
            case ALWAYS -> 1; // Thấp nhất: Chính sách mặc định hàng ngày
            default -> 0;
        };
    }
}
