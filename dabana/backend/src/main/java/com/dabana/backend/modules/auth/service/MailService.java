package com.dabana.backend.modules.auth.service;

import com.dabana.backend.exception.BusinessException;
import com.dabana.backend.modules.auth.util.AuthErrorCode;
import com.dabana.backend.modules.auth.util.OtpPurpose;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

/**
 * Gui email thật qua SMTP (Spring Mail).
 * Hỗ trợ gửi OTP đa năng dựa theo OtpPurpose (Đăng ký, Đặt bàn Guest, Tra cứu đơn...).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from:Dabana Order <no-reply@dabana.vn>}")
    private String from;

    @Value("${app.mail.enabled:true}")
    private boolean mailEnabled;

    /**
     * Overload giữ lại để backward compatibility với code cũ (mặc định REGISTER)
     */
    public void sendOtpEmail(String toEmail, String otpCode, int validMinutes) {
        sendOtpEmail(toEmail, otpCode, validMinutes, OtpPurpose.REGISTER);
    }

    /**
     * Gửi email OTP động theo mục đích (OtpPurpose)
     */
    public void sendOtpEmail(String toEmail, String otpCode, int validMinutes, OtpPurpose purpose) {
        if (!mailEnabled) {
            log.info("[MAIL-DISABLED] OTP {} cho {} với mục đích {} (hết hạn sau {} phút)",
                    otpCode, toEmail, purpose, validMinutes);
            return;
        }

        String subject = getSubjectByPurpose(purpose);
        String html = buildOtpEmailHtml(otpCode, validMinutes, purpose);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(from);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(message);
            log.info("Đã gửi email OTP [{}] đến {}", purpose, toEmail);
        } catch (Exception e) {
            log.error("Gửi email OTP thất bại tới {}: {}", toEmail, e.getMessage());
            throw new BusinessException(AuthErrorCode.OTP_SEND_FAILED);
        }
    }

    // ================= HELPER BUILD HTML & SUBJECT =================

    private String getSubjectByPurpose(OtpPurpose purpose) {
        if (purpose == null) return "[Dabana Order] Mã xác thực OTP của bạn";

        return switch (purpose) {
            case GUEST_BOOKING -> "[Dabana Order] Mã xác thực đặt bàn";
            case GUEST_LOOKUP -> "[Dabana Order] Mã xác thực tra cứu lịch sử đặt bàn";
            case FORGOT_PASSWORD -> "[Dabana Order] Mã xác thực đặt lại mật khẩu";
            case REGISTER -> "[Dabana Order] Mã xác thực đăng ký tài khoản";
        };
    }

    private String buildOtpEmailHtml(String otpCode, int validMinutes, OtpPurpose purpose) {
        String description = switch (purpose != null ? purpose : OtpPurpose.REGISTER) {
            case GUEST_BOOKING -> "Bạn đang thực hiện <b>đặt bàn trực tuyến</b> trên hệ thống Dabana Order.";
            case GUEST_LOOKUP -> "Bạn đang yêu cầu <b>tra cứu lịch sử đặt bàn</b> trên Dabana Order.";
            case FORGOT_PASSWORD -> "Bạn vừa yêu cầu <b>khôi phục mật khẩu</b> cho tài khoản Dabana Order.";
            case REGISTER -> "Bạn vừa yêu cầu <b>xác thực tài khoản</b> trên Dabana Order."; // 👈 Đã đổi text chuẩn
        };

        return """
                <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px; border: 1px solid #eee; border-radius: 12px; background-color: #ffffff;">
                  <h2 style="color: #ff6600; margin-bottom: 8px;">Dabana Order</h2>
                  <p style="font-size: 15px; color: #333;">Xin chào,</p>
                  <p style="font-size: 14px; color: #555; line-height: 1.5;">%s</p>
                  <p style="font-size: 14px; color: #555;">Mã xác thực OTP của bạn là:</p>
                  <div style="text-align:center; margin: 24px 0;">
                    <span style="display:inline-block; font-size: 32px; letter-spacing: 8px; font-weight: 700; color:#ff6600; background:#fff4ec; padding: 12px 28px; border-radius: 8px; border: 1px dashed #ff6600;">%s</span>
                  </div>
                  <p style="font-size: 13px; color: #666;">Mã có hiệu lực trong <b>%d phút</b>. Vì lý do bảo mật, vui lòng tuyệt đối không chia sẻ mã này cho người khác.</p>
                  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                  <p style="color:#999; font-size: 12px; margin: 0;">Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.</p>
                </div>
                """.formatted(description, otpCode, validMinutes);
    }
    // ================= KHÔI PHỤC MẬT KHẨU (NẾU CÓ) =================

    public void sendNewPasswordEmail(String toEmail, String newPassword) {
        if (!mailEnabled) {
            log.info("[MAIL-DISABLED] Mật khẩu mới {} dành cho {}", newPassword, toEmail);
            return;
        }

        String subject = "[Dabana Order] Mật khẩu mới của bạn";
        String html = buildNewPasswordEmailHtml(newPassword);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(from);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(message);
            log.info("Đã gửi email mật khẩu mới đến {}", toEmail);
        } catch (Exception e) {
            log.error("Gửi email mật khẩu mới thất bại tới {}: {}", toEmail, e.getMessage());
            throw new BusinessException(AuthErrorCode.OTP_SEND_FAILED);
        }
    }

    private String buildNewPasswordEmailHtml(String newPassword) {
        return """
                <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px; border: 1px solid #eee; border-radius: 12px;">
                  <h2 style="color: #ff6600; margin-bottom: 4px;">Dabana Order</h2>
                  <p>Xin chào,</p>
                  <p>Bạn (hoặc ai đó) vừa yêu cầu <b>đặt lại mật khẩu</b> cho tài khoản Dabana Order gắn với email này.</p>
                  <p>Mật khẩu mới của bạn là:</p>
                  <div style="text-align:center; margin: 20px 0;">
                    <span style="display:inline-block; font-size: 24px; letter-spacing: 3px; font-weight: 700; color:#ff6600; background:#fff4ec; padding: 12px 24px; border-radius: 8px;">%s</span>
                  </div>
                  <p>Vui lòng đăng nhập bằng mật khẩu mới này và đổi lại mật khẩu khác ngay sau khi đăng nhập để đảm bảo an toàn.</p>
                  <p style="color:#999; font-size: 12px; margin-top: 24px;">Nếu bạn không thực hiện yêu cầu này, vui lòng liên hệ với chúng tôi ngay để bảo vệ tài khoản của bạn.</p>
                </div>
                """.formatted(newPassword);
    }
}