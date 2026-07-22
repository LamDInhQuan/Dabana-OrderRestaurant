package com.dabana.backend.modules.payment.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Danh muc ngan hang, dong bo tu GET https://api.vietqr.io/v2/banks.
 * Id giu nguyen theo VietQR (KHONG auto-increment) de doi chieu nguoc khi
 * dong bo lai, nen entity nay KHONG ke thua BaseEntity (BaseEntity gia dinh
 * id tu sinh IDENTITY).
 *
 * Truong `bin` chinh la "toBin" can truyen khi goi payOS payout, va cung la
 * "bin" tra ve khi payOS tao link thanh toan.
 */
@Getter
@Setter
@Entity
@Table(name = "pm_bank_catalog")
public class BankCatalog {

    @Id
    @Column(name = "id")
    private Integer id; // id goc tu VietQR, KHONG dung @GeneratedValue

    @Column(name = "bin", nullable = false, unique = true, length = 10)
    private String bin;

    @Column(name = "code", nullable = false, unique = true, length = 20)
    private String code;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "short_name", nullable = false, length = 100)
    private String shortName;

    @Column(name = "logo_url", length = 255)
    private String logoUrl;

    @Column(name = "swift_code", length = 20)
    private String swiftCode;

    @Column(name = "transfer_supported", nullable = false)
    private Boolean transferSupported = true;

    @Column(name = "lookup_supported", nullable = false)
    private Boolean lookupSupported = true;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true; // Cho phep chon ngan hang nay khi tao tk branch / nhap tk hoan tien

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}