package com.dabana.backend.modules.subscription.dto.request;

import com.dabana.backend.modules.subscription.enums.PlanStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

/**
 * Khong cho sua planCode/billingCycle sau khi tao (tranh gay nham lan voi cac
 * subscription cu da snapshot theo billingCycle luc dang ky) - chi cho sua gia,
 * han muc, thu tu hien thi, mo ta va trang thai mo ban.
 */
@Data
public class UpdateSubscriptionPlanRequest {

    @NotBlank(message = "name không được để trống")
    @Size(max = 100, message = "name không được vượt quá 100 ký tự")
    private String name;

    @NotNull(message = "price không được để trống")
    @DecimalMin(value = "0", inclusive = true, message = "price không được âm")
    private BigDecimal price;

    @NotNull(message = "maxBranches không được để trống")
    @Min(value = 1, message = "maxBranches phải lớn hơn hoặc bằng 1")
    private Integer maxBranches;

    @Min(value = 0, message = "displayOrder không được âm")
    private Integer displayOrder;

    private String description;

    @NotNull(message = "status không được để trống")
    private PlanStatus status;
}
