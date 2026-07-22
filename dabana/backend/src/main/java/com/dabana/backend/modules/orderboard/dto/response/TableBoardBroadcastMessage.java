package com.dabana.backend.modules.orderboard.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Payload broadcast qua STOMP topic /topic/table-status/{branchId} (Task 5).
 * Chi chua (cac) ban VUA thay doi - khong phai toan bo board - de FE tu
 * merge/patch vao danh sach dang co san (tranh phai GET lai toan bo
 * /api/order-board/branch/{branchId} moi lan co su kien).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TableBoardBroadcastMessage {
    private Long branchId;
    private List<TableBoardResponse> tables;
}
