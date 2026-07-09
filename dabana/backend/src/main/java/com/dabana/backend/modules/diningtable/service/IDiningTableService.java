package com.dabana.backend.modules.diningtable.service;

import com.dabana.backend.modules.diningtable.dto.request.BulkUpdateDiningTablePositionsRequest;
import com.dabana.backend.modules.diningtable.dto.request.CreateDiningTableRequest;
import com.dabana.backend.modules.diningtable.dto.request.UpdateDiningTableRequest;
import com.dabana.backend.modules.diningtable.dto.response.DiningTableResponse;

import java.util.List;

public interface IDiningTableService {

    List<DiningTableResponse> getTablesByBranchAndZone(Long branchId, Long zoneId);

    DiningTableResponse createDiningTable(CreateDiningTableRequest request);

    DiningTableResponse updateDiningTable(Long tableId, UpdateDiningTableRequest request);

    List<DiningTableResponse> bulkUpdatePositions(BulkUpdateDiningTablePositionsRequest request);

    void deleteDiningTable(Long tableId);
}