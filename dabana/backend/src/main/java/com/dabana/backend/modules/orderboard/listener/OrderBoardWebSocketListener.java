package com.dabana.backend.modules.orderboard.listener;

import com.dabana.backend.modules.orderboard.dto.response.TableBoardBroadcastMessage;
import com.dabana.backend.modules.orderboard.dto.response.TableBoardResponse;
import com.dabana.backend.modules.orderboard.event.TableBoardChangedEvent;
import com.dabana.backend.modules.orderboard.service.IOrderBoardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.List;

/**
 * Task 5: cau noi giua nghiep vu (Booking/DiningTable/ExtraOrder) va WebSocket.
 * Dung {@link TransactionalEventListener} (mac dinh phase = AFTER_COMMIT) thay
 * vi {@code @EventListener} thuong de dam bao:
 * - Chi broadcast SAU KHI transaction ghi du lieu commit thanh cong (khong day
 *   du lieu "ma" ra client neu transaction bi rollback vi loi khac o cuoi ham).
 * - Luc doc lai du lieu de build payload (getTableBoards), du lieu da chac chan
 *   duoc flush/commit, tranh doc phai ban ghi cu do doc trong cung transaction
 *   dang do (dirty read trong pham vi 1 transaction Hibernate).
 *
 * Neu WebSocket broadcast loi (vd mat ket noi broker), KHONG duoc de anh huong
 * nguoc lai luong nghiep vu chinh (transaction da commit roi) - chi log loi,
 * FE co the fallback goi lai GET /api/order-board/branch/{branchId}.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OrderBoardWebSocketListener {

    private static final String TOPIC_PREFIX = "/topic/table-status/";

    private final IOrderBoardService orderBoardService;
    private final SimpMessagingTemplate messagingTemplate;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onTableBoardChanged(TableBoardChangedEvent event) {
        if (event.getBranchId() == null || event.getTableIds() == null || event.getTableIds().isEmpty()) {
            return;
        }
        try {
            List<TableBoardResponse> tables = orderBoardService.getTableBoards(event.getTableIds());
            if (tables.isEmpty()) {
                return;
            }
            messagingTemplate.convertAndSend(
                    TOPIC_PREFIX + event.getBranchId(),
                    new TableBoardBroadcastMessage(event.getBranchId(), tables));
        } catch (Exception ex) {
            log.error("Khong the broadcast table-status cho branchId={}, tableIds={}",
                    event.getBranchId(), event.getTableIds(), ex);
        }
    }
}
