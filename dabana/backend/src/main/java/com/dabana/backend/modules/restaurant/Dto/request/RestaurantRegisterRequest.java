package com.dabana.backend.modules.restaurant.Dto.request;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RestaurantRegisterRequest {
// --- Thông tin nhà hàng (Cho phép null ở DTO, bắt buộc ở Service nếu là đối tác) ---
    @Size(max = 250, message = "Tên nhà hàng tối đa 250 ký tự")
    private String restaurantName;

    @Pattern(
            regexp = "^$|^(0|\\+84)[0-9]{9}$",
            message = "Số điện thoại nhà hàng không hợp lệ"
    )
    private String restaurantPhone;

    private String description;

    @Size( max = 255) // Trong DB là Not Null [v] và varchar(255)
    private String logoUrl;


    @Size(max = 150,message = "Email không được vượt quá 150 ký tự") // Mới bổ sung theo DB
    private String email;

    @Size(max = 255,message = "Website không được vượt quá 255 ký tự") // Mới bổ sung theo DB (có tag UNI)
    private String website;

    private String cuisineType;
    

}
