package com.dabana.backend.modules.table_layout;

import com.dabana.backend.common.BaseEntity;
import com.dabana.backend.modules.branch.BranchOperatingStatus;
import com.dabana.backend.modules.branch2.entity.Branch;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

/**
 * B07 Buoc 1: Khu vuc phuc vu (Trong nha, Ngoai troi, VIP, San vuon...).
 */
@Getter
@Setter
@Entity
@Table(name = "rt_layout_zones")
public class Zone extends BaseEntity {

    @ManyToOne
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @NotBlank
    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 500)
    private String description;

    private Boolean active = true; // B07 AF02: tam ngung khu vuc
}
