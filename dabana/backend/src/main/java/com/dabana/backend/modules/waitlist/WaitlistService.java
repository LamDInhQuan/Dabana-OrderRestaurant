//package com.dabana.backend.modules.waitlist;
//
//import com.dabana.backend.exception.BusinessException;
//import com.dabana.backend.modules.auth.entity.User;
//import com.dabana.backend.modules.auth.repository.UserRepository;
//import com.dabana.backend.modules.booking.BookingService;
//import com.dabana.backend.modules.booking.dto.BookingDtos;
//import com.dabana.backend.modules.branch.Branch;
//import com.dabana.backend.modules.branch.BranchRepository;
//import com.dabana.backend.modules.table_layout.RestaurantTable;
//import com.dabana.backend.modules.table_layout.RestaurantTableRepository;
//import com.dabana.backend.modules.table_layout.TableStatus;
//import lombok.RequiredArgsConstructor;
//import lombok.extern.slf4j.Slf4j;
//import org.springframework.beans.factory.annotation.Value;
//import org.springframework.scheduling.annotation.Scheduled;
//import org.springframework.stereotype.Service;
//import org.springframework.transaction.annotation.Transactional;
//
//import java.time.LocalDateTime;
//import java.util.List;
//
///**
// * Trien khai day du dac ta B10: Dang ky hang cho dat ban.
// * - Main Flow buoc 1-5
// * - EF01: het han loi moi → chuyen nguoi ke tiep
// * - BR01: thu tu FIFO theo timestamp dang ky
// * - BR02: han phan hoi loi moi 10 phut (job chinh xac, khong cron polling)
// */
//@Slf4j
//@Service
//@RequiredArgsConstructor
//public class WaitlistService {
//
//    private final WaitlistRepository waitlistRepository;
//    private final BranchRepository branchRepository;
//    private final UserRepository userRepository;
//    private final RestaurantTableRepository tableRepository;
//    private final BookingService bookingService;
//
//    @Value("${app.waitlist.invite-timeout-minutes:10}")
//    private int inviteTimeoutMinutes; // BR02
//
//    // ============================================================
//    // B10 Buoc 2: khach xac nhan tham gia hang cho
//    // ============================================================
//    @Transactional
//    public WaitlistEntry join(Long customerId, Long branchId, Integer guestCount, LocalDateTime desiredTime) {
//        User customer = userRepository.findById(customerId)
//                .orElseThrow(() -> new BusinessException("USER_NOT_FOUND", "Khong tim thay khach hang"));
//        Branch branch = branchRepository.findById(branchId)
//                .orElseThrow(() -> new BusinessException("BRANCH_NOT_FOUND", "Khong tim thay chi nhanh"));
//
//        // Khong cho dang ky trung neu da co luot cho WAITING/INVITED
//        waitlistRepository.findByCustomerIdAndBranchIdAndStatus(customerId, branchId, WaitlistStatus.WAITING)
//                .ifPresent(w -> { throw new BusinessException("ALREADY_IN_QUEUE", "Ban da co trong danh sach cho"); });
//
//        WaitlistEntry entry = new WaitlistEntry();
//        entry.setCustomer(customer);
//        entry.setBranch(branch);
//        entry.setGuestCount(guestCount);
//        entry.setDesiredTime(desiredTime);
//        entry.setStatus(WaitlistStatus.WAITING);
//        return waitlistRepository.save(entry);
//    }
//
//    // ============================================================
//    // B10 Buoc 3-4: co ban trong → giu ban → gui loi moi nguoi dau tien
//    // (goi khi ban duoc giai phong: tu B11 huy/no-show hoac B12 checkout)
//    // ============================================================
//    @Transactional
//    public void notifyNextInQueue(Long branchId, Long freedTableId) {
//        List<WaitlistEntry> queue = waitlistRepository.findNextInQueue(branchId);
//        if (queue.isEmpty()) return;
//
//        RestaurantTable table = tableRepository.findById(freedTableId).orElse(null);
//        if (table == null) return;
//
//        WaitlistEntry next = queue.get(0);
//
//        // Giu ban cho luot cho nay (B10 buoc 3)
//        table.setStatus(TableStatus.HELD_FOR_WAITLIST);
//        tableRepository.save(table);
//
//        // Cap nhat luot cho sang INVITED, khoi dong han 10 phut (BR02)
//        next.setStatus(WaitlistStatus.INVITED);
//        next.setHeldTableId(freedTableId);
//        next.setInvitedAt(LocalDateTime.now());
//        next.setInviteExpiresAt(LocalDateTime.now().plusMinutes(inviteTimeoutMinutes));
//        waitlistRepository.save(next);
//
//        // TODO: gui thong bao qua NotificationService (B09)
//        log.info("[B10] Gui loi moi den khach #{} cho ban #{} (han {})",
//                next.getCustomer().getId(), freedTableId, next.getInviteExpiresAt());
//    }
//
//    // ============================================================
//    // B10 Buoc 5: khach chap nhan loi moi → chuyen sang don dat ban chinh thuc
//    // ============================================================
//    @Transactional
//    public BookingDtos.BookingResponse acceptInvite(Long waitlistEntryId, Long customerId) {
//        WaitlistEntry entry = waitlistRepository.findById(waitlistEntryId)
//                .orElseThrow(() -> new BusinessException("WAITLIST_NOT_FOUND", "Khong tim thay luot cho"));
//
//        if (!entry.getCustomer().getId().equals(customerId)) {
//            throw new BusinessException("FORBIDDEN", "Khong co quyen voi luot cho nay");
//        }
//        if (entry.getStatus() != WaitlistStatus.INVITED) {
//            throw new BusinessException("INVALID_STATE", "Luot cho khong o trang thai moi");
//        }
//        if (entry.getInviteExpiresAt().isBefore(LocalDateTime.now())) {
//            // EF01: het han → xu ly qua scheduler, day chi thong bao cho khach
//            throw new BusinessException("INVITE_EXPIRED", "Da het thoi han phan hoi loi moi (EF01)");
//        }
//
//        // Tao don dat ban chinh thuc qua BookingService (tai su dung B01 Main Flow)
//        BookingDtos.CreateHoldRequest holdReq = new BookingDtos.CreateHoldRequest();
//        holdReq.setBranchId(entry.getBranch().getId());
//        holdReq.setTableId(entry.getHeldTableId());
//        holdReq.setGuestCount(entry.getGuestCount());
//        holdReq.setReservationTime(entry.getDesiredTime());
//
//        BookingDtos.BookingResponse bookingResponse = bookingService.createHold(customerId, holdReq);
//
//        entry.setStatus(WaitlistStatus.CONVERTED);
//        waitlistRepository.save(entry);
//
//        return bookingResponse;
//    }
//
//    // ============================================================
//    // B10 EF01: Scheduled job – het han loi moi → chuyen nguoi ke tiep
//    // (khong dung cron polling, dung fixedRate ngan de sat hon han - BR02)
//    // ============================================================
//    @Scheduled(fixedRate = 30_000) // moi 30 giay de phat hien het han nhanh
//    @Transactional
//    public void processExpiredInvites() {
//        List<WaitlistEntry> expired = waitlistRepository.findExpiredInvites(LocalDateTime.now());
//        for (WaitlistEntry entry : expired) {
//            log.info("[B10 EF01] Loi moi het han cho waitlist #{}", entry.getId());
//
//            // Giai phong ban (ve AVAILABLE)
//            if (entry.getHeldTableId() != null) {
//                tableRepository.findById(entry.getHeldTableId()).ifPresent(table -> {
//                    table.setStatus(TableStatus.AVAILABLE);
//                    tableRepository.save(table);
//
//                    // Chuyen loi moi cho nguoi ke tiep trong hang (EF01)
//                    notifyNextWaiter(entry.getBranch().getId(), entry.getId(), table.getId());
//                });
//            }
//
//            entry.setStatus(WaitlistStatus.EXPIRED);
//            waitlistRepository.save(entry);
//        }
//    }
//
//    /** Chuyen loi moi cho nguoi ke tiep trong hang (bo qua entry vua het han). */
//    private void notifyNextWaiter(Long branchId, Long expiredEntryId, Long tableId) {
//        waitlistRepository.findNextInQueue(branchId).stream()
//                .filter(e -> !e.getId().equals(expiredEntryId))
//                .findFirst()
//                .ifPresent(next -> notifyNextInQueue(branchId, tableId));
//    }
//
//    /** B10 Buoc 2 nguoc: khach tu huy hang cho */
//    @Transactional
//    public void cancel(Long waitlistEntryId, Long customerId) {
//        WaitlistEntry entry = waitlistRepository.findById(waitlistEntryId)
//                .orElseThrow(() -> new BusinessException("WAITLIST_NOT_FOUND", "Khong tim thay luot cho"));
//        if (!entry.getCustomer().getId().equals(customerId)) {
//            throw new BusinessException("FORBIDDEN", "Khong co quyen voi luot cho nay");
//        }
//
//        if (entry.getStatus() == WaitlistStatus.INVITED && entry.getHeldTableId() != null) {
//            tableRepository.findById(entry.getHeldTableId()).ifPresent(t -> {
//                t.setStatus(TableStatus.AVAILABLE);
//                tableRepository.save(t);
//                notifyNextInQueue(entry.getBranch().getId(), t.getId());
//            });
//        }
//
//        entry.setStatus(WaitlistStatus.CANCELLED);
//        waitlistRepository.save(entry);
//    }
//}
