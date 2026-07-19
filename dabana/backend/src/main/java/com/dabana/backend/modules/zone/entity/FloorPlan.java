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

    // Truoc day chi la 1 cot thuong (Integer version = 1) -> JPA khong tu kiem tra khi
    // update, khong co gi ngan 2 giao dich cung sua layout_data ghi de len nhau.
    // @Version bien no thanh optimistic lock that su cua Hibernate: tu dong tang va
    // kiem tra o MOI lan UPDATE. Day la lop bao ve thu 2, bo sung cho pessimistic lock
    // (findByZoneIdForUpdate) ma FloorPlanSyncService dung lam co che chinh.
    @Version
    @Column(nullable = false)
    private Integer version = 1;
}