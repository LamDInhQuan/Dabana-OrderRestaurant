package com.dabana.backend.modules.auth;

import com.dabana.backend.common.BaseEntity;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

/**
 * Tai khoan nguoi dung dung chung cho ca 3 vai tro: Khach hang,
 * Nha hang doi tac, Quan tri vien (phan biet boi truong role).
 * Lien quan: B02 (dang ky doi tac), B14 (ho so khach hang).
 */
@Getter
@Setter
@Entity
@Table(name = "users", uniqueConstraints = {
        @UniqueConstraint(columnNames = "email"),
        @UniqueConstraint(columnNames = "phone")
})
public class User extends BaseEntity {

    @NotBlank
    @Column(nullable = false, length = 150)
    private String fullName;

    @Email
    @Column(unique = true, length = 150)
    private String email;

    @Column(unique = true, length = 20)
    private String phone;

    @JsonIgnore
    @NotBlank
    @Column(nullable = false)
    private String password; // BCrypt hash

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private UserRole role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private AccountStatus status = AccountStatus.ACTIVE;

    @Column(length = 500)
    private String rejectionReason; // B02 EF04

    private Boolean otpVerified = false; // B02 buoc 3
}
