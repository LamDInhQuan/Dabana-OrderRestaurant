package com.dabana.backend.modules.diningtable.entity;

import com.dabana.backend.common.BaseEntity;
import com.dabana.backend.modules.diningtable.util.DiningTableStatus;
import com.dabana.backend.modules.diningtable.util.DiningTableStatusConverter;
import com.dabana.backend.modules.zone.entity.Zone;
import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "rt_layout_tables")
public class DiningTable extends BaseEntity {

    @Version
    @Column(nullable = false)
    private Long version;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "zone_id", nullable = false)
    private Zone zone;

    @NotBlank
    @Column(name = "table_name", nullable = false, length = 50)
    private String tableName;

    @Min(1)
    @Column(nullable = false)
    private Integer capacity;

    @Convert(converter = DiningTableStatusConverter.class)
    @Column(nullable = false)
    private DiningTableStatus status = DiningTableStatus.EMPTY;

    @Column(name = "position_x")
    private Integer positionX;

    @Column(name = "position_y")
    private Integer positionY;

    @Transient
    public String getTableCode() {
        return tableName;
    }

    @Transient
    public void setTableCode(String tableCode) {
        this.tableName = tableCode;
    }
}