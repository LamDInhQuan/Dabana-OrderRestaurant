package com.dabana.backend.modules.auth.repository;

import com.dabana.backend.modules.auth.entity.OtpVerification;
import com.dabana.backend.modules.auth.util.OtpPurpose;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OtpVerificationRepository extends JpaRepository<OtpVerification, Long> {

    Optional<OtpVerification> findFirstByEmailAndPurposeOrderByCreatedAtDesc(String email, OtpPurpose  purpose);

    Optional<OtpVerification> findFirstByEmailAndPurposeAndIsUsedFalseOrderByCreatedAtDesc(String email, OtpPurpose purpose);

    // Vô hiệu hóa các mã cũ chưa dùng khi sinh mã mới
    @Modifying
    @Query("UPDATE OtpVerification o SET o.isUsed = true WHERE o.email = :email AND o.purpose = :purpose AND o.isUsed = false")
    void invalidatePreviousOtps(@Param("email") String email, @Param("purpose") OtpPurpose  purpose);
}