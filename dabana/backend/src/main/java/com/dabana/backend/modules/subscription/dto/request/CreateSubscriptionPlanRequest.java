package com.dabana.backend.modules.subscription.dto.request;

import com.dabana.backend.modules.subscription.enums.BillingCycle;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreateSubscriptionPlanRequest {

    @NotBlank(message = "planCode không được để trống")
    @Size(max = 30, message = "planCode không được vượt quá 30 ký tự")
    private String planCode;

    @NotBlank(message = "name không được để trống")
    @Size(max = 100, message = "name không được vượt quá 100 ký tự")
    private String name;

    @NotNull(message = "price không được để trống")
    @DecimalMin(value = "0", inclusive = true, message = "price không được âm")
    private BigDecimal price;

    @NotNull(message = "billingCycle không được để trống")
    private BillingCycle billingCycle;

    @NotNull(message = "maxBranches không được để trống")
    @Min(value = 1, message = "maxBranches phải lớn hơn hoặc bằng 1")
    private Integer maxBranches;

    @Min(value = 0, message = "displayOrder không được âm")
    private Integer displayOrder = 0;

    private String description;
}
