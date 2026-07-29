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
                .map(operatingHourMapper::mapToDto) // Hoặc mapToDto tùy theo mapper của bạn
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void saveOperatingHours(Long branchId, List<OperatingHourDto> requests) {
        validateOperatingHours(requests);
        operatingHourRepository.deleteByBranchId(branchId);
        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new BusinessException(BranchErrorCode.BRANCH_NOT_FOUND));

        operatingHourRepository.saveAll(operatingHourMapper.toEntity(requests, branch));
    }

    @Override
    @Transactional
    public OperatingHourDto createOperatingHour(Long branchId, OperatingHourDto request) {
        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new BusinessException(BranchErrorCode.BRANCH_NOT_FOUND));

        // 1. Lấy toàn bộ danh sách giờ hiện tại của chi nhánh + item mới thêm để validate chung
        List<OperatingHour> existingEntities = operatingHourRepository.findByBranchIdOrderByDayOfWeekAscOpenTimeAsc(branchId);
        List<OperatingHourDto> currentList = existingEntities.stream()
                .map(operatingHourMapper::mapToDto)
                .collect(Collectors.toList());
        currentList.add(request);
        validateOperatingHours(currentList); // Gọi validate đảm bảo không bị chồng lấn với các ca cũ

        // 2. Lưu vào DB
        OperatingHour entity = operatingHourMapper.toEntity(request,branch);
        entity.setBranch(branch);

        OperatingHour saved = operatingHourRepository.save(entity);
        return operatingHourMapper.mapToDto(saved);
    }

    @Override
    @Transactional
    public OperatingHourDto updateOperatingHour(Long id, OperatingHourDto request) {
        OperatingHour entity = operatingHourRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy khung giờ hoạt động"));

        Long branchId = entity.getBranch().getId();

        // 1. Lấy danh sách hiện tại, thay thế cái cũ bằng request mới để validate
        List<OperatingHour> existingEntities = operatingHourRepository.findByBranchIdOrderByDayOfWeekAscOpenTimeAsc(branchId);
        List<OperatingHourDto> currentList = new ArrayList<>();
        for (OperatingHour item : existingEntities) {
            if (item.getId().equals(id)) {
                currentList.add(request); // Dùng request mới để test
            } else {
                currentList.add(operatingHourMapper.mapToDto(item));
            }
        }
        validateOperatingHours(currentList);

        // 2. Cập nhật thông tin
        entity.setDayOfWeek(request.getDayOfWeek());
        entity.setOpenTime(request.getOpenTime());
        entity.setCloseTime(request.getCloseTime());
//        entity.set(request.getIsClosed());

        OperatingHour updated = operatingHourRepository.save(entity);
        return operatingHourMapper.mapToDto(updated);
    }

    @Override
    @Transactional
    public void deleteOperatingHour(Long id) {
        if (!operatingHourRepository.existsById(id)) {
            throw new RuntimeException("Không tìm thấy khung giờ hoạt động để xóa");
        }
        operatingHourRepository.deleteById(id);
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
        if (!errorDetails.isEmpty()) {
            throw new BusinessException(BranchErrorCode.OVERLAPPING_OPERATING_HOURS, errorDetails);
        }
    }
}