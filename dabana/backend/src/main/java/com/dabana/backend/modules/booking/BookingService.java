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
import com.dabana.backend.modules.diningtable.service.IDiningTableService;
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
    private final IDiningTableService diningTableService;

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
                .map(bookingMapper::toResponse)
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
            LocalDateTime expiresAt = booking.getHoldExpiresAt();
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

    // ============================================================
    // B08: nhan vien check-in cho khach da xac nhan / nghi no-show
    // ============================================================
    @Transactional
    public BookingResponse checkIn(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new BusinessException(BookingErrorCode.BOOKING_NOT_FOUND));
        if (booking.getStatus() != BookingStatus.CONFIRMED
                && booking.getStatus() != BookingStatus.PENDING_NO_SHOW) {
            throw new BusinessException(BookingErrorCode.BOOKING_CANNOT_CHECK_IN);
        }
        booking.setStatus(BookingStatus.CHECKED_IN);
        booking = bookingRepository.save(booking);
        applyTableStatus(booking, DiningTableStatus.OCCUPIED);
        return bookingMapper.toResponse(booking);
    }

    // ============================================================
    // B12: nhan vien check-out sau khi khach dung bua xong
    // LUU Y: phan thanh toan/xuat hoa don (rs_invoices) CHUA lam o day - TODO,
    // se bo sung khi module thanh toan hoan thien. O day chi doi trang thai don + ban.
    // ============================================================
    @Transactional
    public BookingResponse checkOut(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new BusinessException(BookingErrorCode.BOOKING_NOT_FOUND));
        if (booking.getStatus() != BookingStatus.CHECKED_IN) {
            throw new BusinessException(BookingErrorCode.BOOKING_CANNOT_CHECK_OUT);
        }
        // TODO: tinh rs_invoices (preorder_subtotal + extra_order_subtotal + surcharge - deposit_paid)
        // khi module thanh toan duoc thiet ke xong. Hien tai chi dong don, chua tao hoa don.
        booking.setStatus(BookingStatus.COMPLETED);
        booking = bookingRepository.save(booking);
        applyTableStatus(booking, DiningTableStatus.CLEANING);
        return bookingMapper.toResponse(booking);
    }

    // ============================================================
    // B11: nhan vien chot No-show cho don da xac nhan / dang nghi ngo
    // ============================================================
    @Transactional
    public BookingResponse markNoShow(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new BusinessException(BookingErrorCode.BOOKING_NOT_FOUND));
        if (booking.getStatus() != BookingStatus.CONFIRMED
                && booking.getStatus() != BookingStatus.PENDING_NO_SHOW) {
            throw new BusinessException(BookingErrorCode.BOOKING_CANNOT_MARK_NO_SHOW);
        }
        booking.setStatus(BookingStatus.NO_SHOW);
        booking = bookingRepository.save(booking);
        applyTableStatus(booking, DiningTableStatus.CLEANING);
        return bookingMapper.toResponse(booking);
    }

    // ============================================================
    // B11: huy don - tu khach (cancelledByRestaurant=false) hoac tu nha hang (=true)
    // Chi cho huy khi don CHUA check-in. Da CHECKED_IN/COMPLETED/CANCELLED*/NO_SHOW/EXPIRED
    // deu khong the huy nua.
    // ============================================================
    @Transactional
    public BookingResponse cancel(Long bookingId, CancelRequest request) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new BusinessException(BookingErrorCode.BOOKING_NOT_FOUND));
        List<BookingStatus> cancellableFrom = List.of(
                BookingStatus.HOLDING, BookingStatus.AWAITING_PAYMENT, BookingStatus.CONFIRMED);
        if (!cancellableFrom.contains(booking.getStatus())) {
            throw new BusinessException(BookingErrorCode.BOOKING_CANNOT_CANCEL);
        }
        boolean byRestaurant = request != null && Boolean.TRUE.equals(request.getCancelledByRestaurant());
        booking.setStatus(byRestaurant ? BookingStatus.CANCELLED_BY_RESTAURANT : BookingStatus.CANCELLED_BY_CUSTOMER);
        // TODO: neu request.getReason() can luu lai, hien Booking entity chua co cot rieng
        // cho ly do huy - can bo sung cot (vd cancel_reason) neu nghiep vu yeu cau hien thi lai.
        booking = bookingRepository.save(booking);
        applyTableStatus(booking, DiningTableStatus.CLEANING);
        return bookingMapper.toResponse(booking);
    }

    /**
     * Doi trang thai tat ca ban gan voi 1 booking (1 booking co the co nhieu ban
     * qua rs_reservation_tables) theo dung bang transition da chot voi doi tac:
     * CONFIRMED -> RESERVED (chua lam, thuoc luong xac nhan/thanh toan - TODO rieng),
     * CHECKED_IN -> OCCUPIED, COMPLETED/NO_SHOW/CANCELLED_* / EXPIRED -> CLEANING.
     */
    private void applyTableStatus(Booking booking, DiningTableStatus status) {
        List<Long> tableIds = booking.getBookingTables().stream()
                .map(bt -> bt.getDiningTable().getId())
                .toList();
        diningTableService.updateStatusForBooking(tableIds, status);
    }

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
}