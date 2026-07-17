package com.dabana.backend.modules.branch2.service;

import com.dabana.backend.exception.BusinessException;
import com.dabana.backend.modules.branch2.dto.OperatingPeriod;
import com.dabana.backend.modules.branch2.entity.BranchScheduleException;
import com.dabana.backend.modules.branch2.entity.OperatingHour;
import com.dabana.backend.modules.branch2.repository.BranchScheduleExceptionRepository;
import com.dabana.backend.modules.branch2.repository.OperatingHourRepository;
import com.dabana.backend.modules.branch2.util.BranchErrorCode;
import com.dabana.backend.modules.branch2.util.BranchScheduleExceptionType;
import com.dabana.backend.modules.branch2.util.OperatingDay;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AvailableSlotService implements IAvailableSlotService {
    private final OperatingHourRepository operatingHourRepository;
    private final BranchScheduleExceptionRepository branchScheduleExceptionRepository;

    @Override
    public List<OperatingPeriod> getEffectiveOperatingPeriods(Long branchId, LocalDate date) {
        // 1. Lấy lịch hoạt động mặc định
        OperatingDay operatingDay;
        try {
            // Nếu tìm thấy, gán bình thường. Nếu không thấy, Java ném lỗi văng vào block catch bên dưới
            operatingDay = OperatingDay.valueOf(date.getDayOfWeek().name());
            // Logic xử lý tiếp theo khi ngày hợp lệ...
        } catch (IllegalArgumentException e) {
            // Xử lý khi KHÔNG tìm thấy ngày tương ứng trong Enum
            throw new BusinessException(BranchErrorCode.OPERATING_DAY_NOT_VALID);
        }
        List<OperatingPeriod> periods = loadOperatingHours(branchId, operatingDay);
        if (periods.isEmpty()) {
            return Collections.emptyList();
        }
        // 2. Lấy exception trong ngày
        List<BranchScheduleException> exceptions =
                branchScheduleExceptionRepository.findEffectiveExceptions(branchId, date);

        if (exceptions.size() > 0) {
            // 3. Đóng cả ngày
            if (hasCloseAllDay(exceptions)) {
                return Collections.emptyList();
            }
            // 4. Đóng một phần ca
            periods = applyCloseTimeRange(periods, exceptions);
            // 5. Thêm ca hoạt động
            periods = applyAddTimeRange(periods, exceptions);

        }
        // 6. Sắp xếp
        periods.sort(Comparator.comparing(
                OperatingPeriod::getStartTime));

        // 7. GỘP CÁC KHOẢNG THỜI GIAN (Giúp làm sạch dữ liệu trước khi chia Slot)
//        periods = mergeOperatingPeriods(periods);

        // 8 CHIA THÀNH CÁC KHOẢNG THỜI GIAN NHỎ CÓ THỂ ĐẶT BÀN
        periods = generateTimePoints(periods, 60);

        return periods;
    }

    @Override
    public List<OperatingPeriod> loadOperatingHours(Long branchId, OperatingDay operatingDay) {
        List<OperatingHour> operatingHours =
                operatingHourRepository
                        .findByBranchIdAndDayOfWeekOrderByOpenTimeAsc(
                                branchId,
                                operatingDay);

        return operatingHours.stream()
                .map(hour -> OperatingPeriod.builder()
                        .startTime(hour.getOpenTime())
                        .endTime(hour.getCloseTime())
                        .description(hour.getShiftName())
                        .operatingHourId(hour.getId().intValue())
                        .build())
                .collect(Collectors.toList());
    }

    public List<OperatingPeriod> applyCloseTimeRange(List<OperatingPeriod> periods, List<BranchScheduleException> exceptions) {
        List<OperatingPeriod> results = new ArrayList<>(periods);
        for (BranchScheduleException exception : exceptions) {
            if (exception.getExceptionType() != BranchScheduleExceptionType.CLOSE_TIME_RANGE) {
                continue;
            }
            List<OperatingPeriod> currentPeriods = new ArrayList<>();
            for (OperatingPeriod period : results) { // 8-11 ( 9-10 : ex )
                if (exception.getOpenTime().equals(period.getStartTime()) &&
                        exception.getCloseTime().equals(period.getEndTime())) { // bỏ ca này
                    continue;
                }
                if (exception.getOpenTime().isBefore(period.getStartTime()) || exception.getOpenTime().isAfter(period.getEndTime())
                        || exception.getCloseTime().isBefore(period.getStartTime()) || exception.getCloseTime().isAfter(period.getEndTime())) {
                    currentPeriods.add(period);
                    continue;
                }
                if (exception.getOpenTime().isAfter(period.getStartTime())) {  // chia khoảng 8-9
                    currentPeriods.add(new OperatingPeriod(period.getStartTime(), exception.getOpenTime(), period.getDescription(), period.getOperatingHourId()));
                }

                if (exception.getCloseTime().isBefore(period.getEndTime())) {  // chia khoảng 10-11
                    currentPeriods.add(new OperatingPeriod(exception.getCloseTime(), period.getEndTime(), period.getDescription(), period.getOperatingHourId()));
                }
            }
            results = currentPeriods;
        }
        return results;
    }

    public List<OperatingPeriod> applyAddTimeRange(List<OperatingPeriod> periods, List<BranchScheduleException> exceptions) {
        List<OperatingPeriod> results = new ArrayList<>(periods);
        for (BranchScheduleException exception : exceptions) {
            if (exception.getExceptionType() != BranchScheduleExceptionType.ADD_TIME_RANGE) {
                continue;
            }
            results.add(new OperatingPeriod(exception.getOpenTime(), exception.getCloseTime(), exception.getReason(), null));
        }
        return results;
    }

    private boolean hasCloseAllDay(
            List<BranchScheduleException> exceptions) {

        return exceptions.stream()
                .anyMatch(e ->
                        e.getExceptionType()
                                == BranchScheduleExceptionType.CLOSE_ALL_DAY);
    }

    public List<OperatingPeriod> mergeOperatingPeriods(List<OperatingPeriod> periods) {
        if (periods == null || periods.isEmpty()) {
            return Collections.emptyList();
        }
        List<OperatingPeriod> mergedResults = new ArrayList<>();
        OperatingPeriod currentPeriod = periods.get(0);
        for (int i = 1; i < periods.size(); i++) {
            OperatingPeriod nextPeriod = periods.get(i);
            boolean isSameOperatingId = currentPeriod.getOperatingHourId() != null
                    && currentPeriod.getOperatingHourId().equals(nextPeriod.getOperatingHourId());
            boolean isAdjacent = currentPeriod.getStartTime().equals(nextPeriod.getEndTime())
                    || currentPeriod.getEndTime().equals(nextPeriod.getStartTime());
            if (isSameOperatingId && isAdjacent) {
                currentPeriod = new OperatingPeriod(currentPeriod.getStartTime(), nextPeriod.getEndTime(),
                        currentPeriod.getDescription(), currentPeriod.getOperatingHourId()); // đối tượng là kết quả của việc gộp
            } else {
                mergedResults.add(currentPeriod); // tránh gộp nhiều
                currentPeriod = nextPeriod;
            }
        }
        mergedResults.add(currentPeriod);
        return mergedResults;
    }

    public List<OperatingPeriod> generateTimePoints(List<OperatingPeriod> periods, int slotDurationMinutes) {
        List<OperatingPeriod> timePoints = new ArrayList<>();
        if (periods == null || periods.isEmpty() || slotDurationMinutes <= 0) {
            return timePoints;
        }

        for (OperatingPeriod period : periods) {
            LocalTime slotStart = period.getStartTime();
            while (true) {
                LocalTime slotEnd = slotStart.plusMinutes(slotDurationMinutes);
                if (slotEnd.isAfter(period.getEndTime())) {
                    break;
                }
                // Đóng gói mốc giờ kèm theo description của ca hiện tại
                timePoints.add(OperatingPeriod.builder()
                        .startTime(slotStart)
                        .endTime(slotEnd)
                        .description(period.getDescription()) // <--- Lấy đúng trường description bạn cần ở đây
                        .operatingHourId(period.getOperatingHourId())
                        .build());
                slotStart = slotEnd;
            }
        }
        return timePoints;
    }
}
