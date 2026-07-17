package com.dabana.backend.modules.auth.entity;

import com.dabana.backend.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;

/**
 * Tai khoan nguoi dung dung chung cho ca 3 vai tro: Khach hang,
 * Nha hang doi tac, Quan tri vien (phan biet boi truong role).
 * Lien quan: B02 (dang ky doi tac), B14 (ho so khach hang).
 */
@Setter
@Getter
@Entity
@Table(name = "id_users")
public class User extends BaseEntity {

    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    @Column(name = "email", nullable = false, unique = true, length = 150)
    private String email;

    @Column(name = "phone", unique = true, length = 20)
    private String phone;

    @Column(name = "password_hash", nullable = false)
    private String password;

    @Column(nullable = false)
    private Integer status = 1;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Column(name = "notification_preferences", columnDefinition = "LONGTEXT")
    private String notificationPreferences;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<UserRole> userRoles = new HashSet<>();

}