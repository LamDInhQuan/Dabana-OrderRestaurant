package com.dabana.backend.modules.diningtable.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Request doi trang thai ban THU CONG boi nhan vien tren Tab Goi mon.
 *
 * status dung Integer (ma code 1..5) thay vi ten enum, de khop voi
 * DiningTableResponse.status (cung la Integer) va STATUS_META ben Frontend
 * (partner/tab/table_layout/.../statusMeta.js) - noi FE luon lam viec voi
 * ma so 1=EMPTY,2=RESERVED,3=OCCUPIED,4=CLEANING,5=MAINTENANCE.
 *
 * Viec validate cu the (chi cho phep dich la EMPTY/CLEANING/MAINTENANCE,
 * khong cho doi khi ban dang RESERVED/OCCUPIED, ma khong hop le) duoc
 * thuc hien o DiningTableService#updateStatusManually.
 */
@Data
public class UpdateDiningTableStatusRequest {

    @NotNull
    private Integer status;
}