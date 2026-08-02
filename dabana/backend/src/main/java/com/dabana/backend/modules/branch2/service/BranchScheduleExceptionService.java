package com.dabana.backend.modules.branch2.service;

import com.dabana.backend.exception.BusinessException;
import com.dabana.backend.modules.branch2.dto.request.BranchScheduleExceptionRequest;
import com.dabana.backend.modules.branch2.dto.response.BranchScheduleExceptionResponse;
import com.dabana.backend.modules.branch2.entity.Branch;
import com.dabana.backend.modules.branch2.entity.BranchScheduleException;
import com.dabana.backend.modules.branch2.entity.OperatingHour;
import com.dabana.backend.modules.branch2.mapper.BranchScheduleExceptionMapper;
import com.dabana.backend.modules.branch2.repository.BranchRepository;
import com.dabana.backend.modules.branch2.repository.BranchScheduleExceptionRepository;
import com.dabana.backend.modules.branch2.repository.OperatingHourRepository;
import com.dabana.backend.modules.branch2.util.BranchErrorCode;
import com.dabana.backend.modules.branch2.util.BranchScheduleExceptionType;
import com.dabana.backend.modules.branch2.util.OperatingDay;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BranchScheduleExceptionService implements IBranchScheduleExceptionService {
    private final BranchRepository branchRepository;

    private final OperatingHourRepository operatingHourRepository;

    private final BranchScheduleExceptionRepository branchScheduleExceptionRepository;

    private final BranchScheduleExceptionMapper branchScheduleExceptionMapper;

    @Transactional
    @Override
    public BranchScheduleExceptionResponse create(Long branchId, BranchScheduleExceptionRequest request) {
        validate(request);
        Branch branch = branchRepository.findById(branchId).orElseThrow(() -> new BusinessException(
                BranchErrorCode.BRANCH_NOT_FOUND));
        BranchScheduleException entity;
        switch (request.getExceptionType()) {
            case CLOSE_ALL_DAY -> {
                validateCloseAllDayBusiness(branchId, request);
                entity = branchScheduleExceptionMapper.toEntity(
                        request,
                        branch,
                        null
                );
            }
            case CLOSE_TIME_RANGE -> {
                OperatingHour operatingHour =
                        validateCloseTimeRangeBusiness(branchId, request);
                entity = branchScheduleExceptionMapper.toEntity(
                        request,
                        branch,
                        operatingHour
                );
            }
            case ADD_TIME_RANGE -> {
                validateAddTimeRangeBusiness(branchId, request);
                entity = branchScheduleExceptionMapper.toEntity(
                        request,
                        branch,
                        null
                );
            }
            default -> throw new BusinessException(
                    BranchErrorCode.INVALID_EXCEPTION_CONFIGURATION);
        }
        return branchScheduleExceptionMapper.toResponse(branchScheduleExceptionRepository.save(entity));
    }

    @Override
    public List<BranchScheduleExceptionResponse> findAll(Long branchId) {
        List<BranchScheduleException> exceptions = branchScheduleExceptionRepository
                .findByBranchIdOrderByStartDateAsc(branchId);

        return exceptions.stream()
                .map(branchScheduleExceptionMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    @Override
    public BranchScheduleExceptionResponse update(Long branchId, Long id, BranchScheduleExceptionRequest request) {
        // 1. Kiểm tra chi nhánh
        branchRepository.findById(branchId)
                .orElseThrow(() -> new BusinessException(BranchErrorCode.BRANCH_NOT_FOUND));

        // 2. Tìm bản ghi ngoại lệ cần update
        BranchScheduleException existingEntity = branchScheduleExceptionRepository.findById(id)
                .orElseThrow(() -> new BusinessException(BranchErrorCode.SCHEDULE_EXCEPTION_NOT_FOUND));

        if (!existingEntity.getBranch().getId().equals(branchId)) {
            throw new BusinessException(BranchErrorCode.SCHEDULE_EXCEPTION_NOT_FOUND);
        }

        // 3. Validate dữ liệu request mới
        validate(request);
        Branch branch = existingEntity.getBranch();

        // 4. Xử lý logic validate chi tiết và lấy OperatingHour nếu có
        OperatingHour operatingHour = null;
        switch (request.getExceptionType()) {
            case CLOSE_ALL_DAY -> {
                validateCloseAllDayBusiness(branchId, request);
            }
            case CLOSE_TIME_RANGE -> {
                operatingHour = validateCloseTimeRangeBusiness(branchId, request);
            }
            case ADD_TIME_RANGE -> {
                validateAddTimeRangeBusiness(branchId, request);
            }
            default -> throw new BusinessException(
                    BranchErrorCode.INVALID_EXCEPTION_CONFIGURATION);
        }

        // 5. Cập nhật trực tiếp các trường dữ liệu vào entity cũ
        // (Thay thế cho việc gọi updateEntity của MapStruct nếu chưa viết)
        existingEntity.setExceptionType(request.getExceptionType());
        existingEntity.setStartDate(request.getStartDate());
        existingEntity.setEndDate(request.getEndDate());
        existingEntity.setReason(request.getReason());
        existingEntity.setOpenTime(request.getOpenTime());
        existingEntity.setCloseTime(request.getCloseTime());
        existingEntity.setOperatingHour(operatingHour);

        // 6. Lưu lại và trả về response
        BranchScheduleException savedEntity = branchScheduleExceptionRepository.save(existingEntity);
        return branchScheduleExceptionMapper.toResponse(savedEntity);
    }

    @Transactional
    @Override
    public void delete(Long branchId, Long id) {
        // 1. Kiểm tra chi nhánh
        branchRepository.findById(branchId)
                .orElseThrow(() -> new BusinessException(BranchErrorCode.BRANCH_NOT_FOUND));

        // 2. Tìm ngoại lệ và kiểm tra thuộc chi nhánh
        BranchScheduleException entity = branchScheduleExceptionRepository.findById(id)
                .orElseThrow(() -> new BusinessException(BranchErrorCode.SCHEDULE_EXCEPTION_NOT_FOUND));

        if (!entity.getBranch().getId().equals(branchId)) {
            throw new BusinessException(BranchErrorCode.SCHEDULE_EXCEPTION_NOT_FOUND);
        }

        // 3. Xóa bản ghi
        branchScheduleExceptionRepository.delete(entity);
    }

    @Override
    public BranchScheduleExceptionResponse findById(Long branchId, Long id) {
        return null;
    }

    @Override
    public List<BranchScheduleException> loadExceptionsByBranchAndDateTarget(Long branchId, LocalDate date) {
        return branchScheduleExceptionRepository.findEffectiveExceptions(branchId, date);
    }

    private void validate(BranchScheduleExceptionRequest request) {
        switch (request.getExceptionType()) {
            case CLOSE_ALL_DAY -> validateCloseAllDay(request);
            case CLOSE_TIME_RANGE -> validateCloseTimeRange(request);
            case ADD_TIME_RANGE -> validateAddTimeRange(request);
        }
    }

    private void validateCloseAllDay(BranchScheduleExceptionRequest request) {
        if (request.getOperatingHourId() != null) {
            throw new BusinessException(BranchErrorCode.OPERATING_HOUR_NOT_ALLOWED);
        }
        if (request.getOpenTime() != null || request.getCloseTime() != null) {
            throw new BusinessException(BranchErrorCode.INVALID_EXCEPTION_CONFIGURATION);
        }
    }

    private void validateCloseTimeRange(BranchScheduleExceptionRequest request) {
        if (request.getOperatingHourId() == null) {
            throw new BusinessException(BranchErrorCode.OPERATING_HOUR_REQUIRED);
        }
        if (request.getOpenTime() == null || request.getCloseTime() == null) {
            throw new BusinessException(BranchErrorCode.TIME_RANGE_REQUIRED);
        }
        if (!request.getStartDate().equals(request.getEndDate())) {
            throw new BusinessException(BranchErrorCode.SINGLE_DAY_REQUIRED);
        }
        if (!request.getOpenTime().isBefore(request.getCloseTime())) {
            throw new BusinessException(BranchErrorCode.INVALID_TIME_RANGE);
        }
    }

    private void validateAddTimeRange(BranchScheduleExceptionRequest request) {
        if (request.getOperatingHourId() != null) {
            throw new BusinessException(BranchErrorCode.OPERATING_HOUR_NOT_ALLOWED);
        }
        if (request.getOpenTime() == null || request.getCloseTime() == null) {
            throw new BusinessException(BranchErrorCode.TIME_RANGE_REQUIRED);
        }
        if (!request.getStartDate().equals(request.getEndDate())) {
            throw new BusinessException(BranchErrorCode.SINGLE_DAY_REQUIRED);
        }
        if (!request.getOpenTime().isBefore(
                request.getCloseTime())) {
            throw new BusinessException(BranchErrorCode.INVALID_TIME_RANGE);
        }
    }

    private void validateOverrideTimeRange(BranchScheduleExceptionRequest request) {
        if (request.getOperatingHourId() != null) {
            throw new BusinessException(BranchErrorCode.OPERATING_HOUR_NOT_ALLOWED);
        }
        if (request.getOpenTime() == null || request.getCloseTime() == null) {
            throw new BusinessException(BranchErrorCode.TIME_RANGE_REQUIRED);
        }
        if (!request.getStartDate().equals(request.getEndDate())) {
            throw new BusinessException(BranchErrorCode.SINGLE_DAY_REQUIRED);
        }
        if (!request.getOpenTime().isBefore(request.getCloseTime())) {
            throw new BusinessException(BranchErrorCode.INVALID_TIME_RANGE);
        }
    }

    private void validateCloseAllDayBusiness(Long branchId, BranchScheduleExceptionRequest request) {
        List<BranchScheduleException> exceptions = branchScheduleExceptionRepository.findByBranchIdAndDateRange(
                branchId, request.getStartDate(), request.getEndDate());
        if (!exceptions.isEmpty()) {
            throw new BusinessException(BranchErrorCode.EXCEPTION_OVERLAP);
        }
    }

    private OperatingHour validateCloseTimeRangeBusiness(Long branchId, BranchScheduleExceptionRequest request) {
        OperatingHour operatingHour = operatingHourRepository.findById(request.getOperatingHourId()).orElseThrow(() ->
                new BusinessException(BranchErrorCode.OPERATING_HOUR_NOT_FOUND));
        if (!operatingHour.getBranch().getId().equals(branchId)) {
            throw new BusinessException(
                    BranchErrorCode.OPERATING_HOUR_NOT_BELONG_BRANCH);
        }
        if (!operatingHour.getDayOfWeek().name().equals(request.getStartDate().getDayOfWeek().name())) {
            throw new BusinessException(BranchErrorCode.OPERATING_HOUR_NOT_MATCH_DATE);
        }
        if (request.getOpenTime().isBefore(operatingHour.getOpenTime())
                || request.getCloseTime().isAfter(operatingHour.getCloseTime())) {
            throw new BusinessException(BranchErrorCode.TIME_RANGE_OUTSIDE_OPERATING_HOUR);
        }
        List<BranchScheduleException> exceptions = branchScheduleExceptionRepository.findByBranchIdAndDateRange(
                branchId, request.getStartDate(), request.getEndDate());

        for (BranchScheduleException exception : exceptions) {
            if (exception.getExceptionType() == BranchScheduleExceptionType.CLOSE_ALL_DAY) {
                throw new BusinessException(BranchErrorCode.EXCEPTION_OVERLAP);
            }
            if (exception.getExceptionType() == BranchScheduleExceptionType.CLOSE_TIME_RANGE) {
                if (exception.getOperatingHour() != null && exception.getOperatingHour().getId()
                        .equals(request.getOperatingHourId())) {
                    boolean overlap = request.getOpenTime().isBefore(exception.getCloseTime()) // được đóng nhiều lần trong 1 ca
                            && request.getCloseTime().isAfter(exception.getOpenTime());
                    if (overlap) { // chỉ cho đi tiếp khi thời gian mở của thằng sau phải sau thời gian đóng của thằng trước
                        throw new BusinessException(BranchErrorCode.EXCEPTION_OVERLAP);
                    }
                }
            }
        }
        return operatingHour;
    }

    private void validateAddTimeRangeBusiness(Long branchId, BranchScheduleExceptionRequest request) {
        OperatingDay operatingDay = OperatingDay.valueOf(request.getStartDate().getDayOfWeek().name());
        if (operatingDay.name() == null) {
            throw new BusinessException(BranchErrorCode.OPERATING_DAY_NOT_VALID);
        }
        List<OperatingHour> operatingHours = operatingHourRepository.findByBranchIdAndDayOfWeekOrderByOpenTimeAsc(
                branchId, operatingDay);
        for (OperatingHour operatingHour : operatingHours) {
            boolean overlap = request.getOpenTime().isBefore(operatingHour.getCloseTime())
                    && request.getCloseTime().isAfter(operatingHour.getOpenTime());
            if (overlap) {
                throw new BusinessException(BranchErrorCode.ADD_TIME_RANGE_OVERLAP);
            }
        }
        List<BranchScheduleException> exceptions = branchScheduleExceptionRepository.findByBranchIdAndDateRange(
                branchId, request.getStartDate(), request.getEndDate());

        for (BranchScheduleException exception : exceptions) {
            if (exception.getExceptionType() == BranchScheduleExceptionType.CLOSE_ALL_DAY) {
                throw new BusinessException(BranchErrorCode.EXCEPTION_OVERLAP);
            }
            if (exception.getExceptionType() == BranchScheduleExceptionType.ADD_TIME_RANGE) { // thêm nhiều ca 1 ngày
                boolean overlap = request.getOpenTime().isBefore(exception.getCloseTime())
                        && request.getCloseTime().isAfter(exception.getOpenTime());
                if (overlap) {
                    throw new BusinessException(BranchErrorCode.ADD_TIME_RANGE_OVERLAP);
                }
            }
        }
    }
}
