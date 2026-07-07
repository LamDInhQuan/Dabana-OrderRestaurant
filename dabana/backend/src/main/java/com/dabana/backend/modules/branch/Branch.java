package com.dabana.backend.modules.branch;

import java.math.BigDecimal;

import com.dabana.backend.common.BaseEntity;
import com.dabana.backend.modules.restaurant.ApprovalStatus;
import com.dabana.backend.modules.restaurant.Restaurant;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

/**
 * B04: Chi nhanh thuoc mot nha hang doi tac. Moi chi nhanh co thuc don (B06),
 * so do (B07) va chinh sach dat ban (B05) rieng (BR01).
 */
@Getter
@Setter
@Entity
@Table(name = "rt_branches")
public class Branch extends BaseEntity {

@Column(name = "restaurant_id", nullable = false)
    private Integer restaurantId; 
    // Nếu bạn có Entity Restaurant, hãy dùng đoạn dưới đây thay cho trường Integer ở trên:
    // @ManyToOne
    // @JoinColumn(name = "restaurant_id", nullable = false)
    // private Restaurant restaurant;

    @NotBlank
    @Column(name = "branch_name", nullable = false, length = 150)
    private String name;

    @Column(name = "province", length = 100)
    private String province;

    @NotBlank
    @Column(name = "address", nullable = false, columnDefinition = "TEXT")
    private String address;

    @Column(name = "phone", length = 20)
    private String phone;

    // Tọa độ nên dùng BigDecimal(10,6) trong Java để khớp chính xác với decimal(10,6) của DB
    @Column(name = "latitude", precision = 10, scale = 6)
    private BigDecimal latitude;

    @Column(name = "longitude", precision = 10, scale = 6)
    private BigDecimal longitude;

    // Trong DB của bạn trường này đang để là `status` kiểu tinyint(4), mặc định bằng 1
    @Column(name = "status", nullable = false)
    private Integer status = 1;
}
