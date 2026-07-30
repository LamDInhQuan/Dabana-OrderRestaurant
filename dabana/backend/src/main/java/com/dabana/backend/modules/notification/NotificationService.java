package com.dabana.backend.modules.notification;

import com.dabana.backend.common.BaseEntity;
import com.dabana.backend.exception.BusinessException;
import com.dabana.backend.modules.auth.entity.User;
import com.dabana.backend.modules.booking.Booking;
import com.dabana.backend.modules.booking.BookingRepository;
import com.dabana.backend.modules.booking.BookingStatus;
import com.dabana.backend.modules.notification.util.NotificationErrorCode;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

// ===== Entity =====
@Getter
@Setter
@Entity
@Table(name = "nt_notifications")
class Notification extends BaseEntity {

    @ManyToOne
    @JoinColumn(name = "user_id")
    @JsonIgnore
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

public enum NotificationType {
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

    long countByRecipientIdAndReadByUserFalse(Long userId);
    Page<Notification> findByRecipientIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
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

    /**
     * Overload danh cho cac module KHONG thuoc danh sach NotificationType co san
     * (hien tai: modules.subscription) - tranh phai sua NotificationType/Notification/
     * NotificationRepository dang la package-private trong file nay.
     *
     * QUAN TRONG: ham nay KHONG ghi vao bang nt_notifications, vi cot `type` trong DB
     * dang la ENUM cung danh sach gia tri co san - insert mot chuoi ngoai danh sach do
     * se loi rang buoc DB. Hien tai CHI log ra console (dung y nhu doSend() ben tren
     * dang lam - TODO tich hop Email/SMS that van con nguyen, chua bi anh huong).
     *
     * Khi nao san sang, can:
     *   ALTER TABLE nt_notifications MODIFY type VARCHAR(50) NOT NULL;
     * (hoac them cac gia tri ENUM moi) roi moi doi ham nay sang ghi that vao DB.
     */
    public void sendImmediate(User recipient, String eventType, String content, String channel) {
        log.info("[SUBSCRIPTION] Gui [{}] den user #{} qua {} | noi dung: {}",
                eventType, recipient != null ? recipient.getId() : null, channel, content);
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

    private String resolveTableLabel(Booking booking) {
        if (booking == null || booking.getBookingTables() == null || booking.getBookingTables().isEmpty()) {
            return "chưa phân bàn";
        }

        return booking.getBookingTables().stream()
                .map(bt -> bt.getDiningTable() != null ? bt.getDiningTable().getTableCode() : null)
                .filter(Objects::nonNull)
                .collect(Collectors.joining(", "));
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
            if (booking.getCustomer() == null) {
                // Khach vang lai/khach dat khong tai khoan: chua co co che gui
                // thong bao khong gan User (recipient la bat buoc trong Notification).
                continue;
            }

            String content = String.format(
                    "Nhac lich: Ban co dat ban tai %s vao luc %s. Ban: %s",
                    booking.getBranch().getName(),
                    booking.getReservationTime(),
                    resolveTableLabel(booking));

            sendImmediate(booking.getCustomer(), NotificationType.BOOKING_REMINDER, content, "IN_APP");

            booking.setReminderSent(true);
            bookingRepository.save(booking);
        }
    }

    /**
     * B11 Buoc 5: canh bao no-show sau 15 phut qua gio hen.
     */
//    @Scheduled(fixedRate = 60_000)
//    @Transactional
//    public void warnNoShow() {
//        LocalDateTime threshold = LocalDateTime.now().minusMinutes(15);
//        List<Booking> overdue = bookingRepository.findOverdueUncheckedIn(threshold);
//        for (Booking booking : overdue) {
//            booking.setStatus(BookingStatus.PENDING_NO_SHOW);
//            booking.setNoShowWarningAt(LocalDateTime.now());
//            bookingRepository.save(booking);
//
//            // Thong bao nhan vien nha hang de xac nhan (B11 buoc 6)
//            log.warn("[B11] No-show canh bao don #{} tai chi nhanh #{}", booking.getId(), booking.getBranch().getId());
//        }
//    }

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

    /** Lich su thong bao (da doc + chua doc) cua nguoi dung, moi nhat truoc, co phan trang. */
    @Transactional(readOnly = true)
    public Page<Notification> getHistory(Long userId, Pageable pageable) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId, pageable);
    }

    /** Dem so thong bao chua doc, dung de hien so badge tren chuong thong bao. */
    @Transactional(readOnly = true)
    public long countUnread(Long userId) {
        return notificationRepository.countByRecipientIdAndReadByUserFalse(userId);
    }

    /**
     * Danh dau 1 thong bao la da doc. Kiem tra thong bao do dung la cua
     * userId hien tai, tranh mot nguoi dung danh dau ho thong bao cua nguoi khac.
     */
    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        Notification notif = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new BusinessException(NotificationErrorCode.NOTIFICATION_NOT_FOUND));

        if (notif.getRecipient() == null || !Objects.equals(notif.getRecipient().getId(), userId)) {
            throw new BusinessException(NotificationErrorCode.NOTIFICATION_FORBIDDEN);
        }

        if (!Boolean.TRUE.equals(notif.getReadByUser())) {
            notif.setReadByUser(true);
            notificationRepository.save(notif);
        }
    }

    /** Danh dau toan bo thong bao chua doc cua nguoi dung la da doc. */
    @Transactional
    public void markAllAsRead(Long userId) {
        List<Notification> unread = notificationRepository
                .findByRecipientIdAndReadByUserFalseOrderByCreatedAtDesc(userId);
        for (Notification notif : unread) {
            notif.setReadByUser(true);
        }
        notificationRepository.saveAll(unread);
    }
}
