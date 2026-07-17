package com.dabana.backend.modules.auth.service;

import com.dabana.backend.exception.BusinessException;
import com.dabana.backend.modules.auth.service.IOtpService;
import com.dabana.backend.modules.auth.util.AuthErrorCode;
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

    private record OtpEntry(String code, LocalDateTime expiresAt, int failedAttempts, LocalDateTime lockedUntil) {}

    private final Map<String, OtpEntry> otpStore = new ConcurrentHashMap<>();
    private static final int OTP_VALID_MINUTES = 5;
    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final int LOCK_MINUTES = 30;

    @Override
    public String generateAndSend(String identifier) {
        if (!StringUtils.hasText(identifier)) {
            throw new BusinessException(AuthErrorCode.OTP_EMAIL_INVAILID);
        }

        OtpEntry existing = otpStore.get(identifier);
        if (existing != null && existing.lockedUntil() != null
                && existing.lockedUntil().isAfter(LocalDateTime.now())) {
            throw new BusinessException(AuthErrorCode.OTP_LOCKED);
        }

        String code = String.format("%06d", new Random().nextInt(999999));
        otpStore.put(identifier, new OtpEntry(
                code, LocalDateTime.now().plusMinutes(OTP_VALID_MINUTES), 0, null));

        // Gui OTP that qua email. Neu identifier khong phai dinh dang email (vi du la SDT)
        // thi tam thoi chi log lai, vi he thong hien chua tich hop SMS.
        if (identifier.contains("@")) {
            mailService.sendOtpEmail(identifier, code, OTP_VALID_MINUTES);
        } else {
            log.info("[OTP] Identifier {} khong phai email, chua ho tro gui SMS. Ma OTP: {}", identifier, code);
        }

        return code;
    }

    @Override
    public Boolean verify(String identifier, String inputCode) {
        OtpEntry entry = otpStore.get(identifier);

        if (entry == null) {
            throw new BusinessException(AuthErrorCode.OTP_EMAIL_INVAILID);
        }
        if (entry.lockedUntil() != null && entry.lockedUntil().isAfter(LocalDateTime.now())) {
            throw new BusinessException(AuthErrorCode.OTP_LOCKED);
        }
        if (entry.expiresAt().isBefore(LocalDateTime.now())) {
            otpStore.remove(identifier);
            throw new BusinessException(AuthErrorCode.OTP_EXPIRED);
        }
        if (!entry.code().equals(inputCode)) {
            int attempts = entry.failedAttempts() + 1;
            if (attempts >= MAX_FAILED_ATTEMPTS) {
                otpStore.put(identifier, new OtpEntry(
                        entry.code(), entry.expiresAt(), attempts,
                        LocalDateTime.now().plusMinutes(LOCK_MINUTES)));
                throw new BusinessException(AuthErrorCode.OTP_LOCKED);
            }
            otpStore.put(identifier, new OtpEntry(
                    entry.code(), entry.expiresAt(), attempts, null));
            throw new BusinessException(AuthErrorCode.OTP_INVALID);
        }

        otpStore.remove(identifier); // xac thuc thanh cong - xoa entry
        return true ;
    }
}
