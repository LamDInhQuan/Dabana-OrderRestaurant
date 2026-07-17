package com.dabana.backend.modules.policy;

import com.dabana.backend.common.BaseEntity;
import com.dabana.backend.modules.branch.BranchOperatingStatus;
import com.dabana.backend.modules.branch2.entity.Branch;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * B05: Chinh sach dat coc/huy rieng cua tung chi nhanh (BR01).
 * Duoc snapshot vao Booking tai thoi diem giu ban tam thoi
 * (B01 buoc 7, BR04/BR06 cua B05) - khong tham chieu dong.
 */
@Getter
@Setter
@Entity
@Table(name = "rt_pol_reservation_policies")
public class DepositPolicy extends BaseEntity {

    @OneToOne
    @JoinColumn(name = "branch_id", nullable = false, unique = true)
    private com.dabana.backend.modules.branch2.entity.Branch branch;

    private Boolean depositRequired = true; // AF02: khong yeu cau dat coc

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private DepositType depositType = DepositType.PERCENTAGE; // co dinh hoac theo ty le

    @DecimalMin(value = "0.0", message = "Muc coc khong duoc am (EF01)")
    @DecimalMax(value = "100.0", message = "Ty le coc khong duoc vuot 100% (EF01)")
    @Column(precision = 12, scale = 2)
    private BigDecimal depositValue; // so tien hoac % tuy theo depositType

    // Moc thoi gian (gio) truoc gio hen ma khach con duoc huy mien phi
    private Integer freeCancellationHours = 2;

    // Ty le giu coc khi huy muon hoac no-show (%)
    @Column(precision = 5, scale = 2)
    private BigDecimal lateCancellationPenaltyPercent = BigDecimal.valueOf(50);

    @Column(precision = 5, scale = 2)
    private BigDecimal noShowPenaltyPercent = BigDecimal.valueOf(100);
}
