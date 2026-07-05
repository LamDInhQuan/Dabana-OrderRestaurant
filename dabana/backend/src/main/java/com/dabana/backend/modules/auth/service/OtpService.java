package com.dabana.backend.modules.auth;

import com.dabana.backend.exception.BusinessException;
import com.dabana.backend.modules.auth.service.IOtpService;
import com.dabana.backend.modules.auth.util.AuthErrorCode;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Quan ly OTP cho luong dang ky doi tac B02 buoc 3.
 * BR02: hieu luc 5 phut, toi da 5 lan nhap sai truoc khi khoa gui lai 30 phut.
 * Trong moi truong production nen thay the bang Redis + tich hop SMS/Email that.
 */
@Service
public class OtpService implements IOtpService {

    private record OtpEntry(String code, LocalDateTime expiresAt, int failedAttempts, LocalDateTime lockedUntil) {}

    private final Map<String, OtpEntry> otpStore = new ConcurrentHashMap<>();
    private static final int OTP_VALID_MINUTES = 5;
    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final int LOCK_MINUTES = 30;

    @Override
    public String generateAndSend(String identifier) {
        OtpEntry existing = otpStore.get(identifier);
        if (existing != null && existing.lockedUntil() != null
                && existing.lockedUntil().isAfter(LocalDateTime.now())) {
            throw new BusinessException(AuthErrorCode.OTP_ALREADY_VERIFIED.OTP_EMAIL_INVAILID) ;
        }

        String code = String.format("%06d", new Random().nextInt(999999));
        otpStore.put(identifier, new OtpEntry(
                code, LocalDateTime.now().plusMinutes(OTP_VALID_MINUTES), 0, null));

        // TODO: tich hop dich vu Email/SMS that (vi du SendGrid, Twilio)
        System.out.printf("[OTP] Gui ma %s den %s (het han sau %d phut)%n",
                code, identifier, OTP_VALID_MINUTES);
        return code; // tra ve de test; production khong nen tra ve OTP qua API
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
