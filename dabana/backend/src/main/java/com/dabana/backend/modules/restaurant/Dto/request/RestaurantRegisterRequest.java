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
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Data
public class RestaurantRegisterRequest {

    private OwnerDto ownerDto;

    @NotBlank(message = "")
    @Size( max = 155) // Fix length = 150 theo ảnh (để 155 hoặc 150 đều được)
    private String restaurantName;

    private String description;

    @Size( max = 255) // Trong DB là Not Null [v] và varchar(255)
    private String logoUrl;

    @Size(max = 20) // Mới bổ sung theo DB
    private String phone;

    @Size(max = 150) // Mới bổ sung theo DB
    private String email;

    @Size(max = 255,message = "") // Mới bổ sung theo DB (có tag UNI)

    private String website;


    

}
