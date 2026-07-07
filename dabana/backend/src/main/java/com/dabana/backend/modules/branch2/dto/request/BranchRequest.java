package com.dabana.backend.modules.branch2.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class BranchRequest {

    @NotNull(message = "Restaurant ID không được để trống")
    private Integer restaurantId;

    @NotBlank(message = "Tên chi nhánh không được để trống")
    @Size(max = 150, message = "Tên chi nhánh không được vượt quá 150 ký tự")
    private String name;

    @Size(max = 100, message = "Tên tỉnh/thành phố không được vượt quá 100 ký tự")
    private String province;

    @NotBlank(message = "Địa chỉ không được để trống")
    private String address;

    @Size(max = 20, message = "Số điện thoại không được vượt quá 20 ký tự")
    private String phone;

    private BigDecimal latitude;
    private BigDecimal longitude;

    private Integer status = 1;
}