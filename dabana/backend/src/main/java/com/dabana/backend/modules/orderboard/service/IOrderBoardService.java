package com.dabana.backend.modules.orderboard.service;

import com.dabana.backend.modules.orderboard.dto.response.BranchBoardResponse;
import com.dabana.backend.modules.orderboard.dto.response.TableBoardResponse;

import java.util.List;

public interface IOrderBoardService {

    /**
     * Lay danh sach ban realtime theo chi nhanh (nhom theo Zone), kem
     * booking dang active (CONFIRMED / CHECKED_IN) va Unified Order
     * (gop rs_preorder_items + rs_extra_orders) cho tung ban.
     *
     * @param branchId id chi nhanh (bat buoc)
     * @param zoneId   loc theo 1 zone cu the (tuy chon, null = lay tat ca zone cua chi nhanh)
     */
    BranchBoardResponse getBoard(Long branchId, Long zoneId);

    /**
     * Build TableBoardResponse cho 1 tap tableId cu the (khong nhom theo Zone).
     * Dung boi OrderBoardWebSocketListener (Task 5) de build payload broadcast
     * qua STOMP moi khi co TableBoardChangedEvent - chi rebuild dung (cac) ban
     * lien quan thay vi rebuild toan bo board cua chi nhanh.
     */
    List<TableBoardResponse> getTableBoards(List<Long> tableIds);
}
