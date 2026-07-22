package com.dabana.backend.modules.orderboard.event;

import java.util.List;

/**
 * Task 5: domain event noi bo (Spring ApplicationEvent), KHONG lien quan gi
 * den WebSocket/STOMP. Cac module Booking / DiningTable / ExtraOrder chi can
 * publish event nay moi khi vong doi Booking thay doi (check-in/check-out/
 * no-show/cancel), nhan vien doi trang thai ban thu cong, hoac them/sua/xoa
 * mon goi them - KHONG can biet gi ve cach broadcast realtime.
 *
 * OrderBoardWebSocketListener (cung module orderboard) se lang nghe event
 * nay va broadcast qua STOMP topic /topic/table-status/{branchId} SAU KHI
 * transaction phat sinh event COMMIT thanh cong (xem @TransactionalEventListener),
 * tranh day du lieu chua commit hoac da bi rollback ra cho client.
 *
 * Thiet ke event chi mang id (khong mang entity JPA) de tranh:
 * 1) Lazy-loading exception khi listener chay o thread/transaction khac.
 * 2) Phu thuoc nguoc ve mat class giua module Booking/DiningTable/ExtraOrder
 *    va cac entity cua module orderboard (module nay hien khong co entity).
 */
public class TableBoardChangedEvent {

    private final Long branchId;
    private final List<Long> tableIds;

    public TableBoardChangedEvent(Long branchId, List<Long> tableIds) {
        this.branchId = branchId;
        this.tableIds = tableIds;
    }

    public Long getBranchId() {
        return branchId;
    }

    public List<Long> getTableIds() {
        return tableIds;
    }
}
