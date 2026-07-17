package com.dabana.backend.modules.branch2.service;

import com.dabana.backend.modules.branch2.dto.OperatingHourDto;

import java.util.List;

public interface IOperatingHourService {
    List<OperatingHourDto> getByBranch(Long branchId);

    void saveOperatingHours(
            Long branchId,
            List<OperatingHourDto> requests
    );

    void deleteByBranch(Long branchId);
}
