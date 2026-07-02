package com.dabana.backend.modules.booking;

import com.dabana.backend.exception.BusinessException;
import com.dabana.backend.modules.auth.User;
import com.dabana.backend.modules.auth.UserRepository;
import com.dabana.backend.modules.booking.dto.BookingDtos.*;
import com.dabana.backend.modules.branch.Branch;
import com.dabana.backend.modules.branch.BranchRepository;
import com.dabana.backend.modules.menu.MenuItem;
import com.dabana.backend.modules.menu.MenuItemRepository;
import com.dabana.backend.modules.menu.MenuItemStatus;
import com.dabana.backend.modules.policy.DepositPolicy;
import com.dabana.backend.modules.policy.DepositPolicyRepository;
import com.dabana.backend.modules.policy.DepositType;
import com.dabana.backend.modules.table_layout.RestaurantTable;
import com.dabana.backend.modules.table_layout.RestaurantTableRepository;
import com.dabana.backend.modules.table_layout.TableStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
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
    private final RestaurantTableRepository tableRepository;
    private final DepositPolicyRepository policyRepository;
    private final MenuItemRepository menuItemRepository;
    private final UserRepository userRepository;

    private static final int HOLD_MINUTES = 15; // BR03

    // ============================================================
    // B01 Buoc 3 + AF01: chon ban hoac de he thong goi y
    // ============================================================
    @Transactional
    public BookingResponse createHold(Long customerId, CreateHoldRequest req) {
        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new BusinessException("USER_NOT_FOUND", "Khong tim thay khach hang"));

        Branch branch = branchRepository.findById(req.getBranchId())
                .orElseThrow(() -> new BusinessException("BRANCH_NOT_FOUND", "Khong tim thay chi nhanh"));

        RestaurantTable table;
        if (Boolean.TRUE.equals(req.getUseAutoSuggest()) || req.getTableId() == null) {
            // ===== AF01: He thong goi y ban =====
            table = suggestTable(req.getBranchId(), req.getGuestCount(), req.getReservationTime());
        } else {
            // Khoa ban ghi de tranh race condition (B01 EF01/EF02, B08 buoc 4)
            table = tableRepository.findByIdForUpdate(req.getTableId())
                    .orElseThrow(() -> new BusinessException("TABLE_NOT_FOUND", "Khong tim thay ban"));
        }

        // BR02: suc chua phai >= so khach
        if (table.getCapacity() < req.getGuestCount()) {
            throw new BusinessException("TABLE_CAPACITY_INSUFFICIENT",
                    "Ban khong du suc chua cho so luong khach yeu cau (BR02)");
        }

        // EF01: ban da duoc khach khac xac nhan truoc
        if (table.getStatus() == TableStatus.RESERVED || table.getStatus() == TableStatus.OCCUPIED) {
            throw new BusinessException("TABLE_UNAVAILABLE",
                    "Ban khong con kha dung, vui long chon ban khac (EF01)");
        }
        // EF02: ban dang giu cho hang cho
        if (table.getStatus() == TableStatus.HELD_FOR_WAITLIST) {
            throw new BusinessException("TABLE_HELD_FOR_WAITLIST",
                    "Ban dang duoc uu tien giu cho mot luot cho truoc. " +
                    "Vui long chon ban khac hoac tham gia dang ky hang cho (EF02)");
        }
        // BR01: khong duoc trung dat tai cung khung gio (kiem tra muc nghiep vu,
        // rang buoc that su nam o unique constraint tang CSDL)
        if (bookingRepository.existsByTableIdAndReservationTimeAndStatusIn(
                table.getId(), req.getReservationTime(),
                List.of(BookingStatus.HOLDING, BookingStatus.AWAITING_PAYMENT, BookingStatus.CONFIRMED))) {
            throw new BusinessException("TIMESLOT_TAKEN",
                    "Khung gio nay tai ban da co don khac (BR01)");
        }

        // ===== Buoc 6: xac dinh muc dat coc theo chinh sach rieng cua chi nhanh =====
        DepositPolicy policy = policyRepository.findByBranchId(branch.getId()).orElse(null);

        Booking booking = new Booking();
        booking.setCustomer(customer);
        booking.setBranch(branch);
        booking.setTable(table);
        booking.setGuestCount(req.getGuestCount());
        booking.setReservationTime(req.getReservationTime());
        booking.setHoldExpiresAt(LocalDateTime.now().plusMinutes(HOLD_MINUTES)); // BR03
        booking.setStatus(BookingStatus.HOLDING);

        applyDepositSnapshot(booking, policy); // BR06 cua B05 / BR04 cua B01: chot snapshot tai day

        // ===== Buoc 7: giu ban tam thoi - an khoi tim kiem cong khai =====
        table.setStatus(TableStatus.RESERVED);
        tableRepository.save(table);

        bookingRepository.save(booking);
        return toResponse(booking);
    }

    /** AF01: he thong de xuat ban dua tren so khach va tinh trang hien co. */
    private RestaurantTable suggestTable(Long branchId, Integer guestCount, LocalDateTime reservationTime) {
        List<RestaurantTable> candidates = tableRepository.findByZoneBranchId(branchId).stream()
                .filter(t -> t.getStatus() == TableStatus.AVAILABLE)
                .filter(t -> t.getCapacity() >= guestCount)
                .sorted(Comparator.comparingInt(RestaurantTable::getCapacity)) // uu tien ban vua du, tranh lang phi
                .collect(Collectors.toList());

        if (candidates.isEmpty()) {
            throw new BusinessException("NO_TABLE_AVAILABLE",
                    "Khong co ban phu hop trong khung gio nay, vui long thu khung gio khac " +
                    "hoac dang ky hang cho (B10)");
        }
        return candidates.get(0);
    }

    /** Buoc 6 + BR06: chot (snapshot) chinh sach dat coc vao don. */
    private void applyDepositSnapshot(Booking booking, DepositPolicy policy) {
        if (policy == null || Boolean.FALSE.equals(policy.getDepositRequired())) {
            // AF03: nha hang khong yeu cau dat coc
            booking.setSnapshotDepositRequired(false);
            booking.setSnapshotDepositAmount(BigDecimal.ZERO);
            booking.setSnapshotFreeCancellationHours(0);
            return;
        }

        booking.setSnapshotDepositRequired(true);
        booking.setSnapshotFreeCancellationHours(policy.getFreeCancellationHours());

        BigDecimal depositAmount;
        if (policy.getDepositType() == DepositType.FIXED_AMOUNT) {
            depositAmount = policy.getDepositValue();
        } else {
            // PERCENTAGE: ap dung theo % tren gia tri don du kien (uoc tinh toi thieu theo so khach)
            BigDecimal baseEstimate = BigDecimal.valueOf(booking.getGuestCount())
                    .multiply(BigDecimal.valueOf(100000)); // muc uoc tinh co so/khach, co the cau hinh
            depositAmount = baseEstimate
                    .multiply(policy.getDepositValue())
                    .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);
        }
        booking.setSnapshotDepositAmount(depositAmount);
    }

    // ============================================================
    // B01 Buoc 4: nhap thong tin lien he
    // ============================================================
    @Transactional
    public BookingResponse updateContactInfo(Long bookingId, Long customerId, ContactInfoRequest req) {
        Booking booking = getOwnedBooking(bookingId, customerId);
        ensureHoldingNotExpired(booking);

        booking.setContactName(req.getContactName());
        booking.setContactPhone(req.getContactPhone());
        booking.setNote(req.getNote());
        bookingRepository.save(booking);
        return toResponse(booking);
    }

    // ============================================================
    // B01 Buoc 5 + AF02: dat mon truoc (tuy chon)
    // ============================================================
    @Transactional
    public BookingResponse addPreOrderItems(Long bookingId, Long customerId, PreOrderRequest req) {
        Booking booking = getOwnedBooking(bookingId, customerId);
        ensureHoldingNotExpired(booking);

        if (req.getItems() == null || req.getItems().isEmpty()) {
            return toResponse(booking); // AF02: khach bo qua dat mon truoc
        }

        for (var itemReq : req.getItems()) {
            MenuItem menuItem = menuItemRepository.findById(itemReq.getMenuItemId())
                    .orElseThrow(() -> new BusinessException("MENU_ITEM_NOT_FOUND", "Khong tim thay mon an"));

            // BR02 cua B06: chi mon "Dang ban" moi duoc dat truoc
            if (menuItem.getStatus() != MenuItemStatus.SELLING) {
                throw new BusinessException("MENU_ITEM_NOT_AVAILABLE",
                        "Mon \"" + menuItem.getName() + "\" hien khong con ban");
            }

            BookingItem item = new BookingItem();
            item.setBooking(booking);
            item.setMenuItem(menuItem);
            // BR04 cua B06 / BR09 cua B01: chot snapshot ten + gia ngay tai day
            item.setSnapshotName(menuItem.getName());
            item.setSnapshotPrice(menuItem.getPrice());
            item.setQuantity(itemReq.getQuantity());
            item.setIsWalkInOrder(false);

            booking.getItems().add(item);
        }

        bookingRepository.save(booking);
        return toResponse(booking);
    }

    // ============================================================
    // B01 Buoc 8: thanh toan dat coc (goi tu callback cong thanh toan)
    // ============================================================
    @Transactional
    public BookingResponse processPaymentResult(Long bookingId, PaymentResultRequest req) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new BusinessException("BOOKING_NOT_FOUND", "Khong tim thay don dat ban"));

        booking.setPaymentTransactionId(req.getTransactionId());

        if ("SUCCESS".equalsIgnoreCase(req.getStatus())) {
            booking.setPaymentStatus("SUCCESS");
            confirmBooking(booking); // Buoc 9
        } else {
            // ===== EF03: thanh toan that bai =====
            booking.setPaymentStatus("FAILED");
            // Giu ban trong thoi gian con lai, giu nguyen chinh sach/gia da snapshot,
            // khach duoc phep thuc hien lai giao dich (khong doi trang thai HOLDING)
            bookingRepository.save(booking);
            throw new BusinessException("PAYMENT_FAILED",
                    "Thanh toan that bai. Ban van duoc giu trong thoi gian con lai, " +
                    "vui long thuc hien lai giao dich (EF03)");
        }

        return toResponse(booking);
    }

    /** Buoc 9: he thong phe duyet don, khoa ban co dinh, phat hanh xac nhan. */
    private void confirmBooking(Booking booking) {
        booking.setStatus(BookingStatus.CONFIRMED);

        RestaurantTable table = booking.getTable();
        table.setStatus(TableStatus.RESERVED); // khoa co dinh tren so do
        tableRepository.save(table);

        bookingRepository.save(booking);

        // Buoc 10: thiet lap nhac lich - duoc xu ly boi NotificationService (B09)
        // qua scheduled job rieng, theo dung BR05 cua B09 (B01 khong tu gui thong bao).
    }

    /** AF03: nha hang khong yeu cau dat coc - xac nhan ngay khong qua buoc 8. */
    @Transactional
    public BookingResponse confirmWithoutDeposit(Long bookingId, Long customerId) {
        Booking booking = getOwnedBooking(bookingId, customerId);
        ensureHoldingNotExpired(booking);

        if (Boolean.TRUE.equals(booking.getSnapshotDepositRequired())) {
            throw new BusinessException("DEPOSIT_REQUIRED",
                    "Chi nhanh nay yeu cau dat coc, vui long thuc hien thanh toan");
        }

        confirmBooking(booking);
        return toResponse(booking);
    }

    // ============================================================
    // EF04: tu dong huy don het han giu ban (chay dinh ky)
    // ============================================================
    @Transactional
    public void expireOverdueHoldings() {
        List<Booking> expired = bookingRepository.findExpiredHoldings(LocalDateTime.now());
        for (Booking booking : expired) {
            booking.setStatus(BookingStatus.EXPIRED);

            RestaurantTable table = booking.getTable();
            // EF04: chuyen ve Trong, tru khi co hang cho dang doi -> chuyen "Dang giu cho hang cho"
            // logic uu tien hang cho duoc xu ly trong WaitlistService (B10 buoc 3), tai day chi
            // dat trang thai mac dinh la AVAILABLE.
            table.setStatus(TableStatus.AVAILABLE);
            tableRepository.save(table);

            bookingRepository.save(booking);
        }
    }

    // ============================================================
    // Helpers
    // ============================================================
    private Booking getOwnedBooking(Long bookingId, Long customerId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new BusinessException("BOOKING_NOT_FOUND", "Khong tim thay don dat ban"));
        if (!booking.getCustomer().getId().equals(customerId)) {
            throw new BusinessException("FORBIDDEN", "Ban khong co quyen voi don dat ban nay");
        }
        return booking;
    }

    private void ensureHoldingNotExpired(Booking booking) {
        if (booking.getStatus() != BookingStatus.HOLDING) {
            throw new BusinessException("INVALID_STATE", "Don khong o trang thai cho xu ly");
        }
        if (booking.getHoldExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BusinessException("HOLD_EXPIRED", "Da het thoi gian giu ban (EF04)");
        }
    }

    public BookingResponse toResponse(Booking booking) {
        BigDecimal totalPreOrder = booking.getItems().stream()
                .map(i -> i.getSnapshotPrice().multiply(BigDecimal.valueOf(i.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return BookingResponse.builder()
                .id(booking.getId())
                .branchName(booking.getBranch().getName())
                .tableCode(booking.getTable().getTableCode())
                .guestCount(booking.getGuestCount())
                .reservationTime(booking.getReservationTime())
                .holdExpiresAt(booking.getHoldExpiresAt())
                .status(booking.getStatus().name())
                .depositAmount(booking.getSnapshotDepositAmount())
                .totalPreOrderAmount(totalPreOrder)
                .items(booking.getItems().stream()
                        .map(i -> com.dabana.backend.modules.booking.dto.BookingDtos.BookingItemResponse.builder()
                                .name(i.getSnapshotName())
                                .price(i.getSnapshotPrice())
                                .quantity(i.getQuantity())
                                .build())
                        .collect(Collectors.toList()))
                .build();
    }
}
