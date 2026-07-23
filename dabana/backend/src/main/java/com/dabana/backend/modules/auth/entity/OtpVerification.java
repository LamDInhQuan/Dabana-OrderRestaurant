package com.dabana.backend.modules.auth.entity;

import com.dabana.backend.modules.auth.util.OtpPurpose;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "id_otp_verifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OtpVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = true)
    private Long userId;

    @Column(name = "email", length = 150)
    private String email;

    @Column(name = "otp_code", nullable = false, length = 10)
    private String otpCode;

    @Column(name = "channel", nullable = false)
    private String channel;

    @Enumerated(EnumType.STRING)
    @Column(name = "purpose", nullable = false, length = 30)
    private com.dabana.backend.modules.auth.util.OtpPurpose purpose;

    @Column(name = "is_used")
    private Boolean isUsed;

    @Column(name = "expired_at", nullable = false)
    private LocalDateTime expiredAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}