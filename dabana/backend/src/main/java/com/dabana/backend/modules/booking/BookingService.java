package com.dabana.backend.modules.booking;

import com.dabana.backend.exception.BusinessException;
import com.dabana.backend.modules.auth.entity.User;
import com.dabana.backend.modules.auth.repository.UserRepository;
import com.dabana.backend.modules.auth.util.AuthErrorCode;
import com.dabana.backend.modules.booking.dto.BookingDtos.*;
import com.dabana.backend.modules.booking.mapper.BookingMapper;
import com.dabana.backend.modules.booking.service.BookingItemService;
import com.dabana.backend.modules.booking.service.BookingTableService;
import com.dabana.backend.modules.branch2.dto.OperatingPeriod;
import com.dabana.backend.modules.branch2.entity.Branch;
import com.dabana.backend.modules.branch2.repository.BranchRepository;
import com.dabana.backend.modules.branch2.service.AvailableSlotService;
import com.dabana.backend.modules.branch2.util.BranchErrorCode;
import com.dabana.backend.modules.diningtable.util.DiningTableErrorCode;
//import com.dabana.backend.modules.menu.MenuItem;
//import com.dabana.backend.modules.menu.MenuItemStatus;
import com.dabana.backend.modules.menu.repository.MenuItemRepository;
import com.dabana.backend.modules.policy.DepositPolicy;
import com.dabana.backend.modules.policy.DepositPolicyRepository;
import com.dabana.backend.modules.policy.DepositType;
import com.dabana.backend.modules.diningtable.entity.DiningTable;
import com.dabana.backend.modules.diningtable.repository.DiningTableRepository;
import com.dabana.backend.modules.diningtable.util.DiningTableStatus;
import com.dabana.backend.modules.reservation_policy.dto.DepositResult;
import com.dabana.backend.modules.reservation_policy.entity.BranchPolicy;
import com.dabana.backend.modules.reservation_policy.service.BranchPolicyResolverService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Trien khai day du dac ta B01: Dat ban truc tuyen.
 * Main Flow buoc 1-10, Alternative Flow AF01-AF03, Exception Flow EF01-EF04,
 * Business Rules BR01-BR09 - bam sat Bang 2.7.1 trong bao cao.
 */
@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final BranchRepository branchRepository;
    private final DiningTableRepository tableRepository;
    private final DepositPolicyRepository policyRepository;
    private final MenuItemRepository menuItemRepository;
    private final AvailableSlotService availableSlotService;
    private final BranchPolicyResolverService branchPolicyResolverService;
    private final BookingItemService bookingItemService;
    private final BookingTableService bookingTableService;
    private final BookingMapper bookingMapper;

    private static final int HOLD_MINUTES = 10;
    private static final List<BookingStatus> CONFLICT_STATUSES = List.of(
            BookingStatus.HOLDING,
            BookingStatus.CONFIRMED
    );

    // ============================================================
    // B01 Buoc 3 + AF01: chon ban hoac de he thong goi y
    // ============================================================
    @Transactional
    public BookingResponse createHold(User user, CreateHoldRequest req) {
        // 1. Validate Branch
        Branch branch = branchRepository.findById(req.getBranchId())
                .orElseThrow(() -> new BusinessException(BranchErrorCode.BRANCH_NOT_FOUND));
        // 2. Validate giờ hoạt động
        if (!availableSlotService.isReservationTimeAvailable(req.getBranchId(), req.getReservationTime())) {
            throw new BusinessException(BranchErrorCode.OPERATING_HOUR_NOT_FOUND);
        }
        // 3. Resolve policy + tính tiền cọc
        BranchPolicy branchPolicy = branchPolicyResolverService.resolve(branch.getId(), req.getReservationTime());
        DepositResult depositResult = branchPolicyResolverService.calculate(branchPolicy, req.getGuestCount());
        // 4. Validate bàn
        var requestedTableIds = req.getTableIds().stream().distinct().collect(Collectors.toList());
        if (requestedTableIds.isEmpty()) {
            throw new BusinessException(BookingErrorCode.TABLE_IDS_REQUIRED);
        }
        List<DiningTable> tables = bookingTableService.loadTables(req.getTableIds());
        bookingTableService.validateTablesGuestCount(tables, req.getGuestCount());
        bookingTableService.validateBookingConflict(req.getTableIds(), req.getReservationTime());
        // 5. Tạo Booking
        Booking booking = bookingMapper.toEntity(req, user, branch);
        booking.setStatus(BookingStatus.HOLDING);
        String contactName = StringUtils.hasText(req.getContactName())
                ? req.getContactName()
                : user.getFullName();
        String contactPhone = StringUtils.hasText(req.getContactPhone())
                ? req.getContactPhone()
                : user.getPhone();
        booking.setContactName(contactName);
        booking.setContactPhone(contactPhone);
        booking.setNote(req.getNote());
        // 6. Snapshot policy
        booking.setSnapshotDepositAmount(depositResult.getDepositAmount());
        booking.setSnapshotDepositRequired(depositResult.getDepositAmount().compareTo(BigDecimal.ZERO) > 0);
//        booking.setSnapshotFreeCancellationHours(depositResult.ge().getFreeCancellationHours());
        booking.setSnapshotPolicyName(depositResult.getRule().getBranchPolicy().getPolicy().getPolicyCode());
        booking = bookingRepository.save(booking);
        // 7. Lưu bàn
        bookingTableService.saveBookingTables(booking, tables);
        booking.setHoldExpiresAt(
                LocalDateTime.now().plusMinutes(HOLD_MINUTES));
        // 8. Lưu món đặt trước (nếu có)
        if (req.getItems() != null && !req.getItems().isEmpty()) {
            bookingItemService.saveItems(booking, req.getItems());
        }
        return bookingMapper.toResponse(booking);
    }

    public List<BookingResponse> getMyBookings(User user) {
        // 1. Tìm tất cả các booking thuộc về user hiện tại
        List<Booking> bookings = bookingRepository.findByCustomerIdOrderByCreatedAtDesc(user.getId());
        return bookings.stream()
                .map(bookingMapper::toResponse) // Hoặc .map(b -> bookingMapper.toResponse(b))
                .collect(Collectors.toList());
    }

    public BookingResponse getBookingDetail(Long bookingId, User user) {
        // 1. Tìm booking theo ID, nếu không thấy thì ném ngoại lệ ResourceNotFoundException
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new BusinessException(BookingErrorCode.BOOKING_NOT_FOUND));
        // 2. Bảo mật: Đảm bảo khách hàng hiện tại chỉ được xem đơn của chính họ
        if (!booking.getCustomer().getId().equals(user.getId())) {
            throw new BusinessException(AuthErrorCode.ACCESS_DENIED);
        }
        // 3. Map dữ liệu sang BookingResponse DTO
        BookingResponse response = bookingMapper.toResponse(booking);
        // 4. Tính toán các trường động dành riêng cho trang Lock bàn (holdExpiresAt, remainSeconds, paymentAvailable)
        if (booking.getStatus() == BookingStatus.HOLDING || booking.getStatus() == BookingStatus.AWAITING_PAYMENT) {
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime expiresAt = booking.getHoldExpiresAt(); // Giả sử bảng Booking có trường lưu thời gian hết hạn giữ bàn
            if (expiresAt != null && expiresAt.isAfter(now)) {
                // Tính số giây còn lại: holdExpiresAt - bây giờ
                long remainSeconds = java.time.Duration.between(now, expiresAt).toSeconds();
                response.setRemainSeconds(remainSeconds);
                response.setPaymentAvailable(true);
            } else {
                response.setRemainSeconds(0L);
                response.setPaymentAvailable(false);
            }
        } else {
            response.setRemainSeconds(0L);
            response.setPaymentAvailable(false);
        }
        return response;
    }
    /**
     * AF01: he thong de xuat ban dua tren so khach va tinh trang hien co.
     */
    // private RestaurantTable suggestTable(Long branchId, Integer guestCount, LocalDateTime reservationTime) {
    //     List<RestaurantTable> candidates = tableRepository.findByZoneBranchId(branchId).stream()
    //             .filter(t -> t.getStatus() == TableStatus.AVAILABLE)
    //             .filter(t -> t.getCapacity() >= guestCount)
    //             .sorted(Comparator.comparingInt(RestaurantTable::getCapacity)) // uu tien ban vua du, tranh lang phi
    //             .collect(Collectors.toList());

    //     if (candidates.isEmpty()) {
    //         throw new BusinessException("NO_TABLE_AVAILABLE",
    //                 "Khong co ban phu hop trong khung gio nay, vui long thu khung gio khac " +
    //                         "hoac dang ky hang cho (B10)");
    //     }
    //     return candidates.get(0);
    // }
//
//    /**
//     * Buoc 6 + BR06: chot (snapshot) chinh sach dat coc vao don.
//     */
//    private void applyDepositSnapshot(Booking booking, DepositPolicy policy) {
//        if (policy == null || Boolean.FALSE.equals(policy.getDepositRequired())) {
//            // AF03: nha hang khong yeu cau dat coc
//            booking.setSnapshotDepositRequired(false);
//            booking.setSnapshotDepositAmount(BigDecimal.ZERO);
//            booking.setSnapshotFreeCancellationHours(0);
//            return;
//        }
//
//        booking.setSnapshotDepositRequired(true);
//        booking.setSnapshotFreeCancellationHours(policy.getFreeCancellationHours());
//
//        BigDecimal depositAmount;
//        if (policy.getDepositType() == DepositType.FIXED_AMOUNT) {
//            depositAmount = policy.getDepositValue();
//        } else {
//            // PERCENTAGE: ap dung theo % tren gia tri don du kien (uoc tinh toi thieu theo so khach)
//            BigDecimal baseEstimate = BigDecimal.valueOf(booking.getGuestCount())
//                    .multiply(BigDecimal.valueOf(100000)); // muc uoc tinh co so/khach, co the cau hinh
//            depositAmount = baseEstimate
//                    .multiply(policy.getDepositValue())
//                    .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);
//        }
//        booking.setSnapshotDepositAmount(depositAmount);
//    }
//
//    // ============================================================
//    // B01 Buoc 4: nhap thong tin lien he
//    // ============================================================
//    @Transactional
//    public BookingResponse updateContactInfo(Long bookingId, Long customerId, ContactInfoRequest req) {
//        Booking booking = getOwnedBooking(bookingId, customerId);
//        ensureHoldingNotExpired(booking);
//
//        booking.setContactName(req.getContactName());
//        booking.setContactPhone(req.getContactPhone());
//        booking.setNote(req.getNote());
//        bookingRepository.save(booking);
//        return toResponse(booking);
//    }

    // ============================================================
    // B01 Buoc 5 + AF02: dat mon truoc (tuy chon)
    // ============================================================
//    @Transactional
//    public BookingResponse addPreOrderItems(Long bookingId, Long customerId, PreOrderRequest req) {
//        Booking booking = getOwnedBooking(bookingId, customerId);
//        ensureHoldingNotExpired(booking);
//
//        if (req.getItems() == null || req.getItems().isEmpty()) {
//            return toResponse(booking); // AF02: khach bo qua dat mon truoc
//        }
//
//        for (var itemReq : req.getItems()) {
//            MenuItem menuItem = menuItemRepository.findById(itemReq.getMenuItemId())
//                    .orElseThrow(() -> new BusinessException("MENU_ITEM_NOT_FOUND", "Khong tim thay mon an"));
//
//            // BR02 cua B06: chi mon "Dang ban" moi duoc dat truoc
//            if (menuItem.getStatus() != MenuItemStatus.SELLING) {
//                throw new BusinessException("MENU_ITEM_NOT_AVAILABLE",
//                        "Mon \"" + menuItem.getName() + "\" hien khong con ban");
//            }
//
//            BookingItem item = new BookingItem();
//            item.setBooking(booking);
//            item.setMenuItem(menuItem);
//            // BR04 cua B06 / BR09 cua B01: chot snapshot ten + gia ngay tai day
//            item.setSnapshotName(menuItem.getName());
//            item.setSnapshotPrice(menuItem.getPrice());
//            item.setQuantity(itemReq.getQuantity());
//            item.setIsWalkInOrder(false);
//
//            booking.getItems().add(item);
//        }
//
//        bookingRepository.save(booking);
//        return toResponse(booking);
//    }
//
//    // ============================================================
//    // B01 Buoc 8: thanh toan dat coc (goi tu callback cong thanh toan)
//    // ============================================================
//    @Transactional
//    public BookingResponse processPaymentResult(Long bookingId, PaymentResultRequest req) {
//        Booking booking = bookingRepository.findById(bookingId)
//                .orElseThrow(() -> new BusinessException("BOOKING_NOT_FOUND", "Khong tim thay don dat ban"));
//
//        booking.setPaymentTransactionId(req.getTransactionId());
//
//        if ("SUCCESS".equalsIgnoreCase(req.getStatus())) {
//            booking.setPaymentStatus("SUCCESS");
//            confirmBooking(booking); // Buoc 9
//        } else {
//            // ===== EF03: thanh toan that bai =====
//            booking.setPaymentStatus("FAILED");
//            // Giu ban trong thoi gian con lai, giu nguyen chinh sach/gia da snapshot,
//            // khach duoc phep thuc hien lai giao dich (khong doi trang thai HOLDING)
//            bookingRepository.save(booking);
//            throw new BusinessException("PAYMENT_FAILED",
//                    "Thanh toan that bai. Ban van duoc giu trong thoi gian con lai, " +
//                            "vui long thuc hien lai giao dich (EF03)");
//        }
//
//        return toResponse(booking);
//    }
//
//    /**
//     * Buoc 9: he thong phe duyet don, khoa ban co dinh, phat hanh xac nhan.
//     */
//    private void confirmBooking(Booking booking) {
//        booking.setStatus(BookingStatus.CONFIRMED);
//
//        RestaurantTable table = booking.getTable();
//        table.setStatus(TableStatus.RESERVED); // khoa co dinh tren so do
//        tableRepository.save(table);
//
//        bookingRepository.save(booking);
//
//        // Buoc 10: thiet lap nhac lich - duoc xu ly boi NotificationService (B09)
//        // qua scheduled job rieng, theo dung BR05 cua B09 (B01 khong tu gui thong bao).
//    }
//
//    /**
//     * AF03: nha hang khong yeu cau dat coc - xac nhan ngay khong qua buoc 8.
//     */
//    @Transactional
//    public BookingResponse confirmWithoutDeposit(Long bookingId, Long customerId) {
//        Booking booking = getOwnedBooking(bookingId, customerId);
//        ensureHoldingNotExpired(booking);
//
//        if (Boolean.TRUE.equals(booking.getSnapshotDepositRequired())) {
//            throw new BusinessException("DEPOSIT_REQUIRED",
//                    "Chi nhanh nay yeu cau dat coc, vui long thuc hien thanh toan");
//        }
//
//        confirmBooking(booking);
//        return toResponse(booking);
//    }
//
    // ============================================================
    // EF04: tu dong huy don het han giu ban (chay dinh ky)
    // ============================================================
    @Transactional
    public void expireOverdueHoldings() {
        List<Booking> expired = bookingRepository.findExpiredHoldings(LocalDateTime.now());
        for (Booking booking : expired) {
            booking.setStatus(BookingStatus.EXPIRED);
            bookingRepository.save(booking);
        }
    }

//    // ============================================================
//    // Helpers
//    // ============================================================
//    private Booking getOwnedBooking(Long bookingId, Long customerId) {
//        Booking booking = bookingRepository.findById(bookingId)
//                .orElseThrow(() -> new BusinessException("BOOKING_NOT_FOUND", "Khong tim thay don dat ban"));
//        if (!booking.getCustomer().getId().equals(customerId)) {
//            throw new BusinessException("FORBIDDEN", "Ban khong co quyen voi don dat ban nay");
//        }
//        return booking;
//    }
//
//    private void ensureHoldingNotExpired(Booking booking) {
//        if (booking.getStatus() != BookingStatus.HOLDING) {
//            throw new BusinessException("INVALID_STATE", "Don khong o trang thai cho xu ly");
//        }
//        if (booking.getHoldExpiresAt().isBefore(LocalDateTime.now())) {
//            throw new BusinessException("HOLD_EXPIRED", "Da het thoi gian giu ban (EF04)");
//        }
//    }
//
//    public BookingResponse toResponse(Booking booking) {
//        BigDecimal totalPreOrder = booking.getItems().stream()
//                .map(i -> i.getSnapshotPrice().multiply(BigDecimal.valueOf(i.getQuantity())))
//                .reduce(BigDecimal.ZERO, BigDecimal::add);
//
//        return BookingResponse.builder()
//                .id(booking.getId())
//                .branchName(booking.getBranch().getName())
//                .tableCode(booking.getTable().getTableCode())
//                .guestCount(booking.getGuestCount())
//                .reservationTime(booking.getReservationTime())
//                .holdExpiresAt(booking.getHoldExpiresAt())
//                .status(booking.getStatus().name())
//                .depositAmount(booking.getSnapshotDepositAmount())
//                .totalPreOrderAmount(totalPreOrder)
//                .items(booking.getItems().stream()
//                        .map(i -> BookingItemResponse.builder()
//                                .name(i.getSnapshotName())
//                                .price(i.getSnapshotPrice())
//                                .quantity(i.getQuantity())
//                                .build())
//                        .collect(Collectors.toList()))
//                .build();
//    }
}
