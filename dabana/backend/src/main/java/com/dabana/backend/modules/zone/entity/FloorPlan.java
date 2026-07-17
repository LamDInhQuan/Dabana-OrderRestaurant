package com.dabana.backend.modules.zone.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "rt_layout_floor_plans")
public class FloorPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "zone_id", nullable = false)
    private Zone zone;

    @Column(name = "layout_data", nullable = false, columnDefinition = "json")
    private String layoutData;

    @Column(nullable = false)
    private Integer version = 1;
}
