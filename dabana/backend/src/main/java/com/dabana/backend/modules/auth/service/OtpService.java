//package com.dabana.backend.modules.auth;
//
//import com.dabana.backend.exception.BusinessException;
//import org.springframework.stereotype.Service;
//
//import java.time.LocalDateTime;
//import java.util.Map;
//import java.util.Random;
//import java.util.concurrent.ConcurrentHashMap;
//
///**
// * Quan ly OTP cho luong dang ky doi tac B02 buoc 3.
// * BR02: hieu luc 5 phut, toi da 5 lan nhap sai truoc khi khoa gui lai 30 phut.
// * Trong moi truong production nen thay the bang Redis + tich hop SMS/Email that.
// */
//@Service
//public class OtpService {
//
//    private record OtpEntry(String code, LocalDateTime expiresAt, int failedAttempts, LocalDateTime lockedUntil) {}
//
//    private final Map<String, OtpEntry> otpStore = new ConcurrentHashMap<>();
//    private static final int OTP_VALID_MINUTES = 5;
//    private static final int MAX_FAILED_ATTEMPTS = 5;
//    private static final int LOCK_MINUTES = 30;
//
//    public String generateAndSend(String identifier) {
//        OtpEntry existing = otpStore.get(identifier);
//        if (existing != null && existing.lockedUntil() != null
//                && existing.lockedUntil().isAfter(LocalDateTime.now())) {
//            throw new BusinessException("OTP_LOCKED",
//                    "Da nhap sai OTP qua nhieu lan. Vui long thu lai sau.");
//        }
//
//        String code = String.format("%06d", new Random().nextInt(999999));
//        otpStore.put(identifier, new OtpEntry(
//                code, LocalDateTime.now().plusMinutes(OTP_VALID_MINUTES), 0, null));
//
//        // TODO: tich hop dich vu Email/SMS that (vi du SendGrid, Twilio)
//        System.out.printf("[OTP] Gui ma %s den %s (het han sau %d phut)%n",
//                code, identifier, OTP_VALID_MINUTES);
//        return code; // tra ve de test; production khong nen tra ve OTP qua API
//    }
//
//    public void verify(String identifier, String inputCode) {
//        OtpEntry entry = otpStore.get(identifier);
//
//        if (entry == null) {
//            throw new BusinessException("OTP_NOT_FOUND", "Khong tim thay yeu cau OTP, vui long gui lai");
//        }
//        if (entry.lockedUntil() != null && entry.lockedUntil().isAfter(LocalDateTime.now())) {
//            throw new BusinessException("OTP_LOCKED", "Tai khoan tam khoa gui lai OTP, vui long thu lai sau");
//        }
//        if (entry.expiresAt().isBefore(LocalDateTime.now())) {
//            otpStore.remove(identifier);
//            throw new BusinessException("OTP_EXPIRED", "Ma OTP da het han, vui long yeu cau gui lai");
//        }
//        if (!entry.code().equals(inputCode)) {
//            int attempts = entry.failedAttempts() + 1;
//            if (attempts >= MAX_FAILED_ATTEMPTS) {
//                otpStore.put(identifier, new OtpEntry(
//                        entry.code(), entry.expiresAt(), attempts,
//                        LocalDateTime.now().plusMinutes(LOCK_MINUTES)));
//                throw new BusinessException("OTP_LOCKED",
//                        "Da nhap sai qua " + MAX_FAILED_ATTEMPTS + " lan, tam khoa " + LOCK_MINUTES + " phut");
//            }
//            otpStore.put(identifier, new OtpEntry(
//                    entry.code(), entry.expiresAt(), attempts, null));
//            throw new BusinessException("OTP_INVALID", "Ma OTP khong dung");
//        }
//
//        otpStore.remove(identifier); // xac thuc thanh cong - xoa entry
//    }
//}
