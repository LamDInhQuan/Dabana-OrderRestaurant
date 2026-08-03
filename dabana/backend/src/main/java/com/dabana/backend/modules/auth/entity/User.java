package com.dabana.backend.modules.auth.entity;

import com.dabana.backend.common.BaseEntity;
import com.dabana.backend.modules.restaurant.entity.RestaurantLicense;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

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
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
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

      @Column(name = "status_reason", length = 500)
    private String statusReason;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<UserRole> userRoles = new HashSet<>();

    // @OneToMany(mappedBy = "owner", cascade = CascadeType.ALL, orphanRemoval = true)
    // private Set<RestaurantLicense> licenses = new HashSet<>();
}