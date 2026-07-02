package com.dabana.backend.modules.waitlist;

import com.dabana.backend.modules.booking.dto.BookingDtos;
import com.dabana.backend.security.CurrentUserProvider;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

/**
 * /api/waitlists - B10: dang ky va quan ly hang cho dat ban.
 */
@RestController
@RequestMapping("/api/waitlists")
@RequiredArgsConstructor
public class WaitlistController {

    private final WaitlistService waitlistService;
    private final CurrentUserProvider currentUserProvider;

    @Data
    public static class JoinWaitlistRequest {
        @NotNull private Long branchId;
        @NotNull @Min(1) private Integer guestCount;
        @NotNull
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
        private LocalDateTime desiredTime;
    }

    /** B10 Buoc 2: dang ky tham gia hang cho */
    @PostMapping("/join")
    public ResponseEntity<WaitlistEntry> join(@RequestBody JoinWaitlistRequest req) {
        Long customerId = currentUserProvider.getCurrentUserId();
        return ResponseEntity.ok(
                waitlistService.join(customerId, req.getBranchId(), req.getGuestCount(), req.getDesiredTime()));
    }

    /** B10 Buoc 5: chap nhan loi moi → chuyen thanh don dat ban */
    @PostMapping("/{id}/accept")
    public ResponseEntity<BookingDtos.BookingResponse> acceptInvite(@PathVariable Long id) {
        Long customerId = currentUserProvider.getCurrentUserId();
        return ResponseEntity.ok(waitlistService.acceptInvite(id, customerId));
    }

    /** Khach tu huy hang cho */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> cancel(@PathVariable Long id) {
        Long customerId = currentUserProvider.getCurrentUserId();
        waitlistService.cancel(id, customerId);
        return ResponseEntity.noContent().build();
    }
}
