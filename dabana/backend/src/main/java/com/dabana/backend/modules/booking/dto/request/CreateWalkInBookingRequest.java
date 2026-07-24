package com.dabana.backend.modules.booking.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

/**
 * Request nhan khach vang lai (walk-in) - luong rieng, KHONG qua B01
 * (hold -> AF01 chon ban -> dat coc -> CONFIRMED) vi khach khong dat truoc
 * online va dang ngoi san tai ban.
 *
 * Khac voi CreateHoldRequest:
 *  - Khong co reservationTime: nhan ngay tai thoi diem goi API (LocalDateTime.now()).
 *  - Khong co items (mon dat truoc): mon se duoc goi qua ExtraOrderController
 *    SAU KHI booking da CHECKED_IN, dung 1 luong voi "Them mon" hien co o FE.
 *  - Ban phai dang EMPTY (khac voi CreateHoldRequest chi can khong trung
 *    khung gio) - validate o BookingService#createWalkIn.
 */
@Data
public class CreateWalkInBookingRequest {

    @NotNull
    private Long branchId;

    @NotEmpty
    private List<Long> tableIds;

    @NotNull
    @Min(1)
    private Integer guestCount;

    /** Tuy chon - khach vang lai thuong khong cung ten/sdt. Mac dinh o service neu bo trong. */
    private String contactName;

    private String contactPhone;

    /** Tuy chon - Booking.contactEmail dang @NotBlank o entity, se fallback ve email nhan vien neu bo trong. */
    private String contactEmail;

    private String note;
}