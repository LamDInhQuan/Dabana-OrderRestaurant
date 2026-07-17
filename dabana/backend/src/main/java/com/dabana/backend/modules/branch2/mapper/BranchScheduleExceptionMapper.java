package com.dabana.backend.modules.branch2.mapper;

import com.dabana.backend.modules.branch2.dto.BranchImageDto;
import com.dabana.backend.modules.branch2.dto.request.BranchRequest;
import com.dabana.backend.modules.branch2.dto.request.BranchScheduleExceptionRequest;
import com.dabana.backend.modules.branch2.dto.response.BranchResponse;
import com.dabana.backend.modules.branch2.dto.response.BranchScheduleExceptionResponse;
import com.dabana.backend.modules.branch2.entity.Branch;
import com.dabana.backend.modules.branch2.entity.BranchScheduleException;
import com.dabana.backend.modules.branch2.entity.OperatingHour;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.stream.Collectors;

@Component
public class BranchScheduleExceptionMapper {
    public BranchScheduleException toEntity(BranchScheduleExceptionRequest request, Branch branch, OperatingHour operatingHour) {
        if (request == null) return null;
        BranchScheduleException branchScheduleException = new BranchScheduleException();
        branchScheduleException.setBranch(branch);
        branchScheduleException.setStartDate(request.getStartDate());
        branchScheduleException.setEndDate(request.getEndDate());
        branchScheduleException.setExceptionType(request.getExceptionType());
        branchScheduleException.setOperatingHour(operatingHour);
        branchScheduleException.setOpenTime(request.getOpenTime());
        branchScheduleException.setCloseTime(request.getCloseTime());
        branchScheduleException.setReason(request.getReason());
        return branchScheduleException;
    }

    public BranchScheduleExceptionResponse toResponse(BranchScheduleException branchScheduleException) {
        if (branchScheduleException == null) return null;
        BranchScheduleExceptionResponse response = new BranchScheduleExceptionResponse();
        response.setId(branchScheduleException.getId());
        response.setBranchId(branchScheduleException.getBranch().getId());
        response.setStartDate(branchScheduleException.getStartDate());
        response.setEndDate(branchScheduleException.getEndDate());
        response.setExceptionType(branchScheduleException.getExceptionType());
        if (branchScheduleException.getOperatingHour() != null) {
            response.setOperatingHourId(branchScheduleException.getOperatingHour().getId());
            response.setOperatingHourDisplay(branchScheduleException.getOperatingHour().getShiftName());
        }
        response.setOpenTime(branchScheduleException.getOpenTime());
        response.setCloseTime(branchScheduleException.getCloseTime());
        response.setReason(branchScheduleException.getReason());
        response.setCreatedAt(branchScheduleException.getCreatedAt());
        response.setUpdatedAt(branchScheduleException.getUpdatedAt());
        return response;
    }
}
