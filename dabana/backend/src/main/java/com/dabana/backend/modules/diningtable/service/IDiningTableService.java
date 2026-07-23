package com.dabana.backend.modules.diningtable.service;

import com.dabana.backend.modules.diningtable.dto.request.BulkUpdateDiningTablePositionsRequest;
import com.dabana.backend.modules.diningtable.dto.request.CreateDiningTableRequest;
import com.dabana.backend.modules.diningtable.dto.request.UpdateDiningTableRequest;
import com.dabana.backend.modules.diningtable.dto.request.UpdateDiningTableStatusRequest;
import com.dabana.backend.modules.diningtable.dto.response.DiningTableResponse;
import com.dabana.backend.modules.diningtable.util.DiningTableStatus;

import java.util.List;

public interface IDiningTableService {

    List<DiningTableResponse> getTablesByBranchAndZone(Long branchId, Long zoneId);
    List<DiningTableResponse> getTablesByBranchId(Long branchId);

    /**
     * Doi trang thai hang loat cho danh sach ban, dung NOI BO boi BookingService
     * khi vong doi don dat ban thay doi (check-in/check-out/no-show/cancel).
     * KHONG expose qua Controller o day - viec doi trang thai THU CONG cho nhan vien
     * (vd EMPTY/CLEANING/MAINTENANCE tu tay) se lam rieng o mot buoc/API khac,
     * co validate rieng (vd khong cho tu tay set OCCUPIED/RESERVED).
     */
    void updateStatusForBooking(List<Long> tableIds, DiningTableStatus status);

    /**
     * Doi trang thai ban THU CONG boi nhan vien (Tab Goi mon).
     * Chi cho phep dich la EMPTY / CLEANING / MAINTENANCE, va ban hien tai
     * khong duoc dang o RESERVED / OCCUPIED (2 trang thai nay chi Backend
     * duoc tu dong doi qua updateStatusForBooking, theo vong doi Booking).
     */
    DiningTableResponse updateStatusManually(Long tableId, UpdateDiningTableStatusRequest request);

    DiningTableResponse createDiningTable(CreateDiningTableRequest request);

    DiningTableResponse updateDiningTable(Long tableId, UpdateDiningTableRequest request);

    List<DiningTableResponse> bulkUpdatePositions(BulkUpdateDiningTablePositionsRequest request);
    

    void deleteDiningTable(Long tableId);
}