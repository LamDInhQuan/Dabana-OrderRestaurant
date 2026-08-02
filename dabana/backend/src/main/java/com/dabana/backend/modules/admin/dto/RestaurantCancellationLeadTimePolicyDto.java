package com.dabana.backend.modules.admin.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RestaurantCancellationLeadTimePolicyDto {

    @NotNull(message = "Số giờ tối thiểu không được để trống")
    @Min(value = 0, message = "Số giờ tối thiểu phải lớn hơn hoặc bằng 0")
    private Integer minHoursBeforeReservation;

    @NotNull(message = "Trạng thái bật/tắt không được để trống")
    private Boolean enabled;

    private String description;
}
