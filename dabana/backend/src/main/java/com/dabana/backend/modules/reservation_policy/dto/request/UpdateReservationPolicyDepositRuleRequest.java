package com.dabana.backend.modules.reservation_policy.dto.request;

import com.dabana.backend.modules.reservation_policy.util.DepositType;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class UpdateReservationPolicyDepositRuleRequest {

    @NotNull(message = "Loại tiền cọc không được để trống")
    private DepositType depositType;

    // --- SỐ LƯỢNG KHÁCH ---
    @NotNull(message = "Số khách tối thiểu không được để trống")
    @Min(value = 1, message = "Số khách tối thiểu phải từ 1 người trở lên")
    private Integer minGuests;

    @Min(value = 1, message = "Số khách tối đa phải lớn hơn 0")
    private Integer maxGuests; // Can be null (vô tận)

    @PositiveOrZero(message = "Dung sai số khách không được là số âm")
    private Integer maxCapacitySlop;

    // --- GIÁ TRỊ CỌC ---
    @NotNull(message = "Giá trị cọc không được để trống")
    @PositiveOrZero(message = "Giá trị cọc phải lớn hơn hoặc bằng 0")
    @DecimalMax(value = "100.0", message = "Phần trăm cọc tối đa chỉ được 100%") // Áp dụng khi type = PERCENTAGE
    private BigDecimal depositValue;

    // --- CÁC NGƯỠNG ĐƠN HÀNG ---
    @PositiveOrZero(message = "Tổng hóa đơn tối thiểu không được là số âm")
    private BigDecimal minOrderAmount;

    @PositiveOrZero(message = "Tiền đặt món trước tối thiểu không được là số âm")
    private BigDecimal minPreorderAmount;

    // --- MỨC CỌC SÀN / TRẦN ---
    @PositiveOrZero(message = "Mức cọc tối thiểu không được là số âm")
    private BigDecimal minDepositAmount;

    @PositiveOrZero(message = "Mức cọc tối đa không được là số âm")
    private BigDecimal maxDepositAmount;
}
