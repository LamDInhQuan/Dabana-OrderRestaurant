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
@Table(name = "id_users", uniqueConstraints = {
        @UniqueConstraint(columnNames = "email"),
        @UniqueConstraint(columnNames = "phone")
})
public class User extends BaseEntity {

    @NotBlank
    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    @Email
    @Column(name = "email", unique = true, length = 150)
    private String email;

    @Column(name = "phone", unique = true, length = 20)
    private String phone;

    @JsonIgnore
    @NotBlank
    @Column(name = "password_hash", nullable = false, length = 255)
    private String password;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    @Column(name = "status", nullable = false)
    private Integer status = 1;

    @Column(name = "avatar_url", length = 255)
    private String avatarUrl;

    @Column(name = "notification_preferences", columnDefinition = "LONGTEXT")
    private String notificationPreferences;
}