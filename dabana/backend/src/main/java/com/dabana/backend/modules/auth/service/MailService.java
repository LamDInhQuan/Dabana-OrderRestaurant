package com.dabana.backend.modules.auth.service;

import com.dabana.backend.exception.BusinessException;
import com.dabana.backend.modules.auth.util.AuthErrorCode;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

/**
 * Gui email that qua SMTP (Spring Mail).
 * Duoc dung boi OtpService de gui ma OTP xac thuc dang ky nha hang doi tac (B02 buoc 3).
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
     * Gui email OTP dang HTML don gian.
     * Neu app.mail.enabled=false (moi truong dev khong co SMTP that) thi chi log ra console,
     * khong nem loi de khong chan luong dang ky.
     */
    public void sendOtpEmail(String toEmail, String otpCode, int validMinutes) {
        if (!mailEnabled) {
            log.info("[MAIL-DISABLED] OTP {} danh cho {} (het han sau {} phut)", otpCode, toEmail, validMinutes);
            return;
        }

        String subject = "[Dabana Order] Mã xác thực OTP đăng ký nhà hàng đối tác";
        String html = buildOtpEmailHtml(otpCode, validMinutes);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(from);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(message);
            log.info("Da gui email OTP den {}", toEmail);
        } catch (Exception e) {
            log.error("Gui email OTP that bai toi {}: {}", toEmail, e.getMessage());
            throw new BusinessException(AuthErrorCode.OTP_SEND_FAILED);
        }
    }

    private String buildOtpEmailHtml(String otpCode, int validMinutes) {
        return """
                <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px; border: 1px solid #eee; border-radius: 12px;">
                  <h2 style="color: #ff6600; margin-bottom: 4px;">Dabana Order</h2>
                  <p>Xin chào,</p>
                  <p>Bạn vừa yêu cầu đăng ký tài khoản <b>Nhà hàng đối tác</b> trên Dabana Order.</p>
                  <p>Mã xác thực OTP của bạn là:</p>
                  <div style="text-align:center; margin: 20px 0;">
                    <span style="display:inline-block; font-size: 28px; letter-spacing: 6px; font-weight: 700; color:#ff6600; background:#fff4ec; padding: 12px 24px; border-radius: 8px;">%s</span>
                  </div>
                  <p>Mã có hiệu lực trong <b>%d phút</b>. Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>
                  <p style="color:#999; font-size: 12px; margin-top: 24px;">Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.</p>
                </div>
                """.formatted(otpCode, validMinutes);
    }

        public void sendNewPasswordEmail(String toEmail, String newPassword) {
        if (!mailEnabled) {
            log.info("[MAIL-DISABLED] Mat khau moi {} danh cho {}", newPassword, toEmail);
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
            log.info("Da gui email mat khau moi den {}", toEmail);
        } catch (Exception e) {
            log.error("Gui email mat khau moi that bai toi {}: {}", toEmail, e.getMessage());
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
