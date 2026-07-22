package com.dabana.backend.modules.orderboard.dto.response;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

/**
 * Response goc cho GET /api/order-board/branch/{branchId}: danh sach
 * ban theo tung Zone cua chi nhanh, kem booking dang active + don hang
 * da gop (Tab Goi Mon - muc 4.4 tai lieu yeu cau).
 */
@Data
public class BranchBoardResponse {
    private Long branchId;
    private List<ZoneBoardResponse> zones = new ArrayList<>();
}
