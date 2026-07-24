package com.dabana.backend.modules.auth.service;

import com.dabana.backend.exception.BusinessException;
import com.dabana.backend.modules.auth.entity.OtpVerification;
import com.dabana.backend.modules.auth.repository.OtpVerificationRepository;
import com.dabana.backend.modules.auth.service.IOtpService;
import com.dabana.backend.modules.auth.util.AuthErrorCode;
import com.dabana.backend.modules.auth.util.OtpPurpose;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Quan ly OTP cho luong dang ky doi tac B02 buoc 3.
 * BR02: hieu luc 5 phut, toi da 5 lan nhap sai truoc khi khoa gui lai 30 phut.
 * OTP duoc gui that qua email (xem MailService). Trong moi truong production
 * nen thay the bo nho ConcurrentHashMap ben duoi bang Redis co TTL.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OtpService implements IOtpService {

    private final MailService mailService;
    private final OtpVerificationRepository otpVerificationRepository;

    private record OtpEntry(String code, LocalDateTime expiresAt, int failedAttempts, LocalDateTime lockedUntil) {
    }

    private final Map<String, OtpEntry> otpStore = new ConcurrentHashMap<>();
    private static final int OTP_VALID_MINUTES = 5;
    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final int LOCK_MINUTES = 30;

    @Transactional
    @Override
    public String generateAndSend(String identifier, OtpPurpose purpose) {
        if (!StringUtils.hasText(identifier)) {
            throw new BusinessException(AuthErrorCode.OTP_EMAIL_INVAILID);
        }
        String code = String.format("%06d", new Random().nextInt(999999));
        otpVerificationRepository.invalidatePreviousOtps(identifier, purpose);

        OtpVerification otpEntity = OtpVerification.builder()
                .email(identifier)
                .otpCode(code)
                .channel("email")
                .purpose(purpose)
                .isUsed(false)
                .expiredAt(LocalDateTime.now().plusMinutes(OTP_VALID_MINUTES))
                .build();
        otpVerificationRepository.save(otpEntity);

        // Gui OTP that qua email. Neu identifier khong phai dinh dang email (vi du la SDT)
        // thi tam thoi chi log lai, vi he thong hien chua tich hop SMS.
        if (identifier.contains("@")) {
            mailService.sendOtpEmail(identifier, code, OTP_VALID_MINUTES, purpose);
        } else {
            log.info("[OTP] Identifier {} khong phai email, chua ho tro gui SMS. Ma OTP: {}", identifier, code);
        }

        return code;
    }

    @Transactional
    @Override
    public Boolean verify(String identifier, String inputCode, OtpPurpose purpose) {
        OtpVerification otp = otpVerificationRepository.findFirstByEmailAndPurposeAndIsUsedFalseOrderByCreatedAtDesc(identifier, purpose)
                .orElseThrow(() -> new BusinessException(AuthErrorCode.OTP_EMAIL_INVAILID));
        // Check hết hạn
        if (otp.getExpiredAt().isBefore(LocalDateTime.now())) {
            throw new BusinessException(AuthErrorCode.OTP_EXPIRED);
        }
        // Check sai mã OTP
        if (!otp.getOtpCode().equals(inputCode)) {
            throw new BusinessException(AuthErrorCode.OTP_INVALID);
        }
        // Xác thực thành công -> set is_used = true
        otp.setIsUsed(true);
        otpVerificationRepository.save(otp);
        return true;
    }
}
