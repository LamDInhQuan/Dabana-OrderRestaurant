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
import org.springframework.data.jpa.repository.Query;
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

    @Column(name = "branch_id")
    private Long branchId;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(length = 30)
    private String channel; // EMAIL / SMS / IN_APP

    @Column(length = 30)
    private String sendStatus = "PENDING"; // PENDING / SENT / FAILED

    private Integer retryCount = 0;        // BR02 cua B09: toi da 3 lan retry

    private Boolean readByUser = false;
}

// ===== Repository =====
interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    @Query("SELECT n FROM Notification n WHERE n.recipient.id = :userId AND (:branchId IS NULL OR n.branchId = :branchId OR n.branchId IS NULL) AND n.readByUser = false ORDER BY n.createdAt DESC")
    List<Notification> findUnreadForUser(Long userId, Long branchId);

    @Query("SELECT COUNT(n) FROM Notification n WHERE n.recipient.id = :userId AND (:branchId IS NULL OR n.branchId = :branchId OR n.branchId IS NULL) AND n.readByUser = false")
    long countUnreadForUser(Long userId, Long branchId);

    @Query("SELECT n FROM Notification n WHERE n.recipient.id = :userId AND (:branchId IS NULL OR n.branchId = :branchId OR n.branchId IS NULL) ORDER BY n.createdAt DESC")
    Page<Notification> findHistoryForUser(Long userId, Long branchId, Pageable pageable);

    @Query("SELECT n FROM Notification n WHERE n.recipient.id = :userId AND n.readByUser = false")
    List<Notification> findAllUnreadForUser(Long userId);
    
    List<Notification> findBySendStatusAndRetryCountLessThan(String status, int maxRetries);
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
    public void sendImmediate(User recipient, NotificationType type, String content, String channel, Long branchId) {
        if (recipient == null)
            return;

        Notification notif = new Notification();
        notif.setRecipient(recipient);
        notif.setType(type);
        notif.setContent(content);
        notif.setChannel(channel);
        notif.setBranchId(branchId);
        notif = notificationRepository.save(notif);
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
                    "Nhắc lịch: Bạn có đặt bàn tại %s vào lúc %s. Bàn: %s",
                    booking.getBranch().getName(),
                    booking.getReservationTime(),
                    resolveTableLabel(booking));

            sendImmediate(booking.getCustomer(), NotificationType.BOOKING_REMINDER, content, "IN_APP", booking.getBranch().getId());

            booking.setReminderSent(true);
            bookingRepository.save(booking);
        }
    }

    /**
     * B11 Buoc 5: canh bao no-show sau 15 phut qua gio hen.
     */
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
    public List<Notification> getUnread(Long userId, Long branchId) {
        return notificationRepository.findUnreadForUser(userId, branchId);
    }

    @Transactional(readOnly = true)
    public long countUnread(Long userId, Long branchId) {
        return notificationRepository.countUnreadForUser(userId, branchId);
    }

    @Transactional(readOnly = true)
    public Page<Notification> getHistory(Long userId, Long branchId, Pageable pageable) {
        return notificationRepository.findHistoryForUser(userId, branchId, pageable);
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
        List<Notification> unreadList = notificationRepository.findAllUnreadForUser(userId);
        for (Notification n : unreadList) {
            n.setReadByUser(true);
        }
        notificationRepository.saveAll(unreadList);
    }
}