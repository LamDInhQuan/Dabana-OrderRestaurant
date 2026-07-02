package com.dabana.backend.modules.table_layout;

import com.dabana.backend.common.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

/**
 * B07: ban an tren so do bo tri. B08: trang thai van hanh theo thoi gian
 * thuc duoc quan ly o day (chi B08 co quyen ghi de truong status -
 * BR09 cua B07 / BR05 cua B08).
 *
 * Toa do (positionX, positionY) phuc vu giao dien keo-tha (3.1.1 Frontend).
 */
@Getter
@Setter
@Entity
@Table(name = "restaurant_tables")
public class RestaurantTable extends BaseEntity {

    @ManyToOne
    @JoinColumn(name = "zone_id", nullable = false)
    private Zone zone;

    @NotBlank
    @Column(nullable = false, length = 50)
    private String tableCode; // vi du: "T01", "VIP-02"

    @Min(1)
    @Column(nullable = false)
    private Integer capacity; // suc chua toi da - B01 BR02

    private Double positionX; // toa do tren so do (px hoac %)
    private Double positionY;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TableStatus status = TableStatus.AVAILABLE; // BR06 cua B07: mac dinh Trong
}
