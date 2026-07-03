package com.dabana.backend.modules.notification;

import com.dabana.backend.common.BaseEntity;
import com.dabana.backend.modules.auth.User;
import com.dabana.backend.modules.booking.Booking;
import com.dabana.backend.modules.booking.BookingRepository;
import com.dabana.backend.modules.booking.BookingStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

// ===== Entity =====
@Getter
@Setter
@Entity
@Table(name = "nt_notifications")
class Notification extends BaseEntity {

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User recipient;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private NotificationType type;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(length = 30)
    private String channel; // EMAIL / SMS / IN_APP

    @Column(length = 30)
    private String sendStatus = "PENDING"; // PENDING / SENT / FAILED

    private Integer retryCount = 0;        // BR02 cua B09: toi da 3 lan retry

    private Boolean readByUser = false;
}

enum NotificationType {
    BOOKING_CONFIRMED,   // Tuc thi sau B01 buoc 9 (BR01 cua B09)
    BOOKING_REMINDER,    // 15-30 phut truoc gio an (B09 buoc 5)
    BOOKING_CANCELLED,   // B11
    NO_SHOW_WARNING,     // B11 buoc 5
    WAITLIST_INVITED,    // B10 buoc 4
    REVIEW_INVITATION,   // Sau B12 hoan tat
    PARTNER_APPROVED,    // B03/B04 duoc duyet
    PARTNER_REJECTED     // B03/B04 bi tu choi
}

// ===== Repository =====
interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByRecipientIdAndReadByUserFalseOrderByCreatedAtDesc(Long userId);
    List<Notification> findBySendStatusAndRetryCountLessThan(String status, int maxRetry);
}

/**
 * B09: Thong bao va nhac lich.
 * BR01: xac nhan dat ban la bat buoc va tuc thi.
 * BR02: retry toi da 3 lan (1/5/15 phut) neu gui that bai.
 * BR05: B09 chi chiu trach nhiem gui/retry/luu lich su; noi dung do quy trinh goc cung cap.
 * BR06: moi tac vu gui co idempotency key (dung notificationId).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final BookingRepository bookingRepository;

    /** Gui thong bao tuc thi (B09 buoc 3 - su kien co tinh tuc thi) */
    @Transactional
    public void sendImmediate(User recipient, NotificationType type, String content, String channel) {
        Notification notif = new Notification();
        notif.setRecipient(recipient);
        notif.setType(type);
        notif.setContent(content);
        notif.setChannel(channel);
        notificationRepository.save(notif);
        doSend(notif); // gui ngay
    }

    private void doSend(Notification notif) {
        try {
            // TODO: tich hop dich vu Email (SendGrid), SMS (Twilio), hoac push in-app
            // Hien tai in log de test (BR06: idempotency key = notif.getId())
            log.info("[B09] Gui [{}] den user #{} qua {} | Key={}",
                    notif.getType(), notif.getRecipient().getId(), notif.getChannel(), notif.getId());
            notif.setSendStatus("SENT");
        } catch (Exception ex) {
            notif.setSendStatus("FAILED");
            log.error("[B09] Gui that bai cho notification #{}: {}", notif.getId(), ex.getMessage());
        }
        notificationRepository.save(notif);
    }

    /**
     * B09 Buoc 5: nhac lich hen 15-30 phut truoc gio an.
     * Chay moi 5 phut de phat hien cac don can nhac.
     */
    @Scheduled(fixedRate = 300_000)
    @Transactional
    public void sendBookingReminders() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime windowEnd = now.plusMinutes(30);

        List<Booking> needReminder = bookingRepository.findBookingsNeedingReminder(now, windowEnd);
        for (Booking booking : needReminder) {
            String content = String.format(
                    "Nhac lich: Ban co dat ban tai %s vao luc %s. Ban: %s",
                    booking.getBranch().getName(),
                    booking.getReservationTime(),
                    booking.getTable().getTableCode());

            sendImmediate(booking.getCustomer(), NotificationType.BOOKING_REMINDER, content, "IN_APP");
            sendImmediate(booking.getCustomer(), NotificationType.BOOKING_REMINDER, content, "EMAIL");

            booking.setReminderSent(true);
            bookingRepository.save(booking);
        }
    }

    /**
     * B11 Buoc 5: canh bao no-show sau 15 phut qua gio hen.
     */
    @Scheduled(fixedRate = 60_000)
    @Transactional
    public void warnNoShow() {
        LocalDateTime threshold = LocalDateTime.now().minusMinutes(15);
        List<Booking> overdue = bookingRepository.findOverdueUncheckedIn(threshold);
        for (Booking booking : overdue) {
            booking.setStatus(BookingStatus.PENDING_NO_SHOW);
            booking.setNoShowWarningAt(LocalDateTime.now());
            bookingRepository.save(booking);

            // Thong bao nhan vien nha hang de xac nhan (B11 buoc 6)
            log.warn("[B11] No-show canh bao don #{} tai chi nhanh #{}", booking.getId(), booking.getBranch().getId());
        }
    }

    /**
     * B09 BR02: retry gui lai cho cac thong bao that bai, toi da 3 lan.
     */
    @Scheduled(fixedRate = 60_000)
    @Transactional
    public void retryFailedNotifications() {
        List<Notification> failed = notificationRepository
                .findBySendStatusAndRetryCountLessThan("FAILED", 3);
        for (Notification notif : failed) {
            notif.setRetryCount(notif.getRetryCount() + 1);
            doSend(notif);
        }
    }

    /** Lay thong bao chua doc cua nguoi dung (in-app) */
    @Transactional(readOnly = true)
    public List<Notification> getUnread(Long userId) {
        return notificationRepository.findByRecipientIdAndReadByUserFalseOrderByCreatedAtDesc(userId);
    }
}
