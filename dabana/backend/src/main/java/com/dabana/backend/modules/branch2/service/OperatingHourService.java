package com.dabana.backend.modules.branch2.service;

import com.dabana.backend.exception.BusinessException;
import com.dabana.backend.modules.branch2.dto.OperatingHourDto;
import com.dabana.backend.modules.branch2.entity.Branch;
import com.dabana.backend.modules.branch2.entity.OperatingHour;
import com.dabana.backend.modules.branch2.mapper.OperatingHourMapper;
import com.dabana.backend.modules.branch2.repository.BranchRepository;
import com.dabana.backend.modules.branch2.repository.OperatingHourRepository;
import com.dabana.backend.modules.branch2.util.BranchErrorCode;
import com.dabana.backend.modules.branch2.util.OperatingDay;
import com.dabana.backend.modules.branch2.util.OperatingHourErrorDetail;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OperatingHourService implements IOperatingHourService {

    private final OperatingHourRepository operatingHourRepository;
    private final BranchRepository branchRepository;
    private final OperatingHourMapper operatingHourMapper;

    @Override
    public List<OperatingHourDto> getByBranch(Long branchId) {
        List<OperatingHour> entityList = operatingHourRepository.findByBranchIdOrderByDayOfWeekAscOpenTimeAsc(branchId);

        return entityList.stream()
                .map(operatingHourMapper::mapToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void saveOperatingHours(Long branchId, List<OperatingHourDto> requests) {
        validateOperatingHours(requests);
        // 2. Xóa sạch dữ liệu cũ của riêng branch này trong database
        operatingHourRepository.deleteByBranchId(branchId);
        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new BusinessException(BranchErrorCode.BRANCH_NOT_FOUND));

        operatingHourRepository.saveAll(operatingHourMapper.toEntity(requests, branch));
    }

    @Override
    public void deleteByBranch(Long branchId) {

    }

    private void validateOperatingHours(List<OperatingHourDto> request) {
        Map<OperatingDay, List<OperatingHourDto>> shiftInDaysMap = new HashMap<>();
        for (OperatingHourDto dto : request) { // map các ca theo ngày
            if (!shiftInDaysMap.containsKey(dto.getDayOfWeek())) {
                shiftInDaysMap.put(dto.getDayOfWeek(), new ArrayList<>());
            }
            shiftInDaysMap.get(dto.getDayOfWeek()).add(dto);
        }
        List<OperatingHourErrorDetail> errorDetails = new ArrayList<>();
        for (Map.Entry<OperatingDay, List<OperatingHourDto>> entry : shiftInDaysMap.entrySet()) {  // sắp xếp ca trong ngày từ sớm đến muộn
            List<OperatingHourDto> shifts = entry.getValue();
            shifts.sort((o1, o2) -> {
                int compare = o1.getOpenTime().compareTo(o2.getOpenTime());
                if (compare != 0) {
                    return compare;
                }
                return o1.getCloseTime().compareTo(o2.getCloseTime());
            });
            for (int i = 0; i < shifts.size() - 1; i++) {
                OperatingHourDto nextShift = shifts.get(i + 1);
                OperatingHourDto currentShift = shifts.get(i);
                if (nextShift.getOpenTime().isBefore(currentShift.getCloseTime())) {
                    errorDetails.add(OperatingHourErrorDetail.builder()
                            .field(null)
                            .dayOfWeek(currentShift.getDayOfWeek().name())
                            .message(
                                    String.format(
                                            "%s - %s chồng lấn với %s - %s",
                                            nextShift.getOpenTime(),
                                            nextShift.getCloseTime(),
                                            currentShift.getOpenTime(),
                                            currentShift.getCloseTime()
                                    )
                            ).build());
                }
            }

        }
        if (errorDetails.size() > 0) {
            throw new BusinessException(BranchErrorCode.OVERLAPPING_OPERATING_HOURS, errorDetails);
        }

    }
}
