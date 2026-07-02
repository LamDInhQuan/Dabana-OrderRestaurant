package com.dabana.backend.modules.notification;

import com.dabana.backend.security.CurrentUserProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final CurrentUserProvider currentUserProvider;

    @GetMapping("/unread")
    public ResponseEntity<List<?>> getUnread() {
        Long userId = currentUserProvider.getCurrentUserId();
        return ResponseEntity.ok(notificationService.getUnread(userId));
    }
}
