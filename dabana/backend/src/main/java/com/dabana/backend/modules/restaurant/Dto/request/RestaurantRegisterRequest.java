package com.dabana.backend.modules.restaurant.Dto.request;

import com.dabana.backend.modules.restaurant.ApprovalStatus;
import com.dabana.backend.modules.restaurant.Dto.OwnerDto;

import jakarta.persistence.Column;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Data
public class RestaurantRegisterRequest {


    @NotBlank(message = "Tên nhà hàng không được trống")
    @Size( max = 155,message = "Tên nhà hàng không được vượt quá 155 ký tự") // Fix length = 150 theo ảnh (để 155 hoặc 150 đều được)
    private String restaurantName;

    private String description;

    @Size( max = 255) // Trong DB là Not Null [v] và varchar(255)
    private String logoUrl;

    @Size(max = 20,message = "Số điện thoại không được vượt quá 20 ký tự") // Mới bổ sung theo DB
    private String phone;

    @Size(max = 150,message = "Email không được vượt quá 150 ký tự") // Mới bổ sung theo DB
    private String email;

    @Size(max = 255,message = "Website không được vượt quá 255 ký tự") // Mới bổ sung theo DB (có tag UNI)
    private String website;

    private String cuisineType;
    

}
