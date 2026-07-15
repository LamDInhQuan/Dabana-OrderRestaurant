package com.dabana.backend.modules.restaurant.Dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Data
public class RestaurantRequest {

    @NotBlank(message = "Tên thương hiệu không được để trống")
    @Size(max = 100, message = "Tên thương hiệu không được vượt quá 100 ký tự")
    private String brandName;
    
    @Size(max = 500, message = "Logo URL không được vượt quá 500 ký tự")
    private String logoUrl;

    private String description;

    @Size(max = 100, message = "Ngành ẩm thực chính không được vượt quá 100 ký tự")
    private String cuisineType;
    

}
