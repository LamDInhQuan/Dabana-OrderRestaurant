package com.dabana.backend.modules.payment.entity;

import com.dabana.backend.common.BaseEntity;
import com.dabana.backend.modules.booking.Booking;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

/**
 * Thong tin tai khoan khach nhap de nhan hoan tien coc, khi khach huy dat ban
 * va thoi diem huy thoa dieu kien chinh sach huy cua branch
 * (rt_branch_policies / rt_pol_reservation_policies).
 *
 * Luu snapshot qua FK bank_id -> BankCatalog: du sau nay bank_id.is_active doi,
 * lich su van giu nguyen ten ngan hang luc khach nhap.
 */
@Getter
@Setter
@Entity
@Table(name = "pm_refund_bank_infos")
public class RefundBankInfo extends BaseEntity {

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reservation_id", nullable = false, unique = true)
    private Booking reservation;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bank_id", nullable = false)
    private BankCatalog bank;

    @NotBlank
    @Column(name = "account_number", nullable = false, length = 50)
    private String accountNumber;

    @NotBlank
    @Column(name = "account_holder_name", nullable = false, length = 150)
    private String accountHolderName; // Ten chu tk khach cung cap
}