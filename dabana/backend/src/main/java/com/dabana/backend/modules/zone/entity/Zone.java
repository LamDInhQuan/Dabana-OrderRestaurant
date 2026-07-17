package com.dabana.backend.modules.zone.entity;

import com.dabana.backend.common.BaseEntity;
import com.dabana.backend.modules.branch2.entity.Branch;
import com.dabana.backend.modules.diningtable.entity.DiningTable;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "rt_layout_zones")
public class Zone extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @NotBlank
    @Column(name = "zone_name", nullable = false, length = 100)
    private String zoneName;

    @Column(columnDefinition = "TEXT")
    private String description;

    @OneToMany(mappedBy = "zone")
    @OrderBy("id ASC")
    private List<DiningTable> tables = new ArrayList<>();
}