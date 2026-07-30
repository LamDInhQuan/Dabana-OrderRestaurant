package com.dabana.backend.modules.notification;

import com.dabana.backend.security.CurrentUserProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final CurrentUserProvider currentUserProvider;

    /** Thong bao chua doc cua nguoi dung hien tai (in-app), moi nhat truoc. */
    @GetMapping("/unread")
    public ResponseEntity<List<?>> getUnread() {
        Long userId = currentUserProvider.getCurrentUserId();
        return ResponseEntity.ok(notificationService.getUnread(userId));
    }

    /** So thong bao chua doc, dung de hien so badge tren chuong thong bao. */
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount() {
        Long userId = currentUserProvider.getCurrentUserId();
        return ResponseEntity.ok(Map.of("count", notificationService.countUnread(userId)));
    }

    /** Lich su thong bao (da doc + chua doc) cua nguoi dung, co phan trang. */
    @GetMapping
    public ResponseEntity<Page<?>> getHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Long userId = currentUserProvider.getCurrentUserId();
        Page<?> data = notificationService.getHistory(
                userId, PageRequest.of(page, size, Sort.by("createdAt").descending()));
        return ResponseEntity.ok(data);
    }

    /** Danh dau 1 thong bao la da doc. */
    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id) {
        Long userId = currentUserProvider.getCurrentUserId();
        notificationService.markAsRead(id, userId);
        return ResponseEntity.ok().build();
    }

    /** Danh dau toan bo thong bao chua doc cua nguoi dung la da doc. */
    @PostMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead() {
        Long userId = currentUserProvider.getCurrentUserId();
        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok().build();
    }
}
