package com.dabana.backend.modules.branch2.service;

import com.dabana.backend.modules.branch2.dto.request.BranchScheduleExceptionRequest;
import com.dabana.backend.modules.branch2.dto.response.BranchScheduleExceptionResponse;
import com.dabana.backend.modules.branch2.entity.BranchScheduleException;

import java.time.LocalDate;
import java.util.List;

public interface IBranchScheduleExceptionService {

    BranchScheduleExceptionResponse create(
            Long branchId,
            BranchScheduleExceptionRequest request);

    BranchScheduleExceptionResponse update(
            Long branchId,
            Long id,
            BranchScheduleExceptionRequest request);

    void delete(
            Long branchId,
            Long id);

    List<BranchScheduleExceptionResponse> findAll(Long branchId);

    BranchScheduleExceptionResponse findById(
            Long branchId,
            Long id);

    List<BranchScheduleException> loadExceptionsByBranchAndDateTarget(
            Long branchId,
            LocalDate date) ;


}