package com.dabana.backend.modules.booking.service;

import com.dabana.backend.exception.BusinessException;
import com.dabana.backend.modules.auth.entity.User;
import com.dabana.backend.modules.auth.repository.UserRepository;
import com.dabana.backend.modules.auth.service.OtpService;
import com.dabana.backend.modules.auth.util.AuthErrorCode;
import com.dabana.backend.modules.auth.util.OtpPurpose;
import com.dabana.backend.modules.booking.Booking;
import com.dabana.backend.modules.booking.BookingErrorCode;
import com.dabana.backend.modules.booking.BookingRepository;
import com.dabana.backend.modules.booking.BookingStatus;
import com.dabana.backend.modules.booking.dto.BookingDtos.*;
import com.dabana.backend.modules.booking.dto.PolicySnapshotDto;
import com.dabana.backend.modules.booking.dto.request.CreateWalkInBookingRequest;
import com.dabana.backend.modules.booking.mapper.BookingMapper;
import com.dabana.backend.modules.branch2.entity.Branch;
import com.dabana.backend.modules.branch2.entity.BranchCancellationPolicy;
import com.dabana.backend.modules.branch2.repository.BranchCancellationPolicyRepository;
import com.dabana.backend.modules.branch2.repository.BranchRepository;
import com.dabana.backend.modules.branch2.service.AvailableSlotService;
import com.dabana.backend.modules.branch2.service.BranchCancellationPolicyService;
import com.dabana.backend.modules.branch2.util.BranchErrorCode;
import com.dabana.backend.modules.diningtable.service.DiningTableService;
//import com.dabana.backend.modules.menu.MenuItem;
//import com.dabana.backend.modules.menu.MenuItemStatus;
import com.dabana.backend.modules.menu.repository.MenuItemRepository;
import com.dabana.backend.modules.orderboard.event.TableBoardChangedEvent;
import com.dabana.backend.modules.diningtable.entity.DiningTable;
import com.dabana.backend.modules.diningtable.repository.DiningTableRepository;
import com.dabana.backend.modules.diningtable.util.DiningTableStatus;
import com.dabana.backend.modules.invoice.dto.request.ConfirmCheckoutRequest;
import com.dabana.backend.modules.invoice.dto.response.InvoicePreviewResponse;
import com.dabana.backend.modules.invoice.service.IInvoiceService;
import com.dabana.backend.modules.invoice.util.InvoiceErrorCode;
import com.dabana.backend.modules.reservation_policy.dto.DepositResult;
import com.dabana.backend.modules.reservation_policy.entity.BranchPolicy;
import com.dabana.backend.modules.reservation_policy.service.BranchPolicyResolverService;
import com.dabana.backend.modules.reservation_policy.util.DepositType;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Trien khai day du dac ta B01: Dat ban truc tuyen.
 * Main Flow buoc 1-10, Alternative Flow AF01-AF03, Exception Flow EF01-EF04,
 * Business Rules BR01-BR09 - bam sat Bang 2.7.1 trong bao cao.
 */
@Service
@RequiredArgsConstructor
public class BookingService implements IBookingService {

    private final BookingRepository bookingRepository;
    private final BranchRepository branchRepository;
    private final DiningTableRepository tableRepository;
    private final MenuItemRepository menuItemRepository;
    private final AvailableSlotService availableSlotService;
    private final BranchPolicyResolverService branchPolicyResolverService;
    private final BookingItemService bookingItemService;
    private final BookingTableService bookingTableService;
    private final BookingMapper bookingMapper;
    private final DiningTableService diningTableService;
    private final UserRepository userRepository;
    private final BranchCancellationPolicyService branchCancellationPolicyService;
    private final IInvoiceService invoiceService;

    // Task 5: chi publish event noi bo (khong biet gi ve WebSocket/STOMP) - xem
    // OrderBoardWebSocketListener (module orderboard) de biet noi lang nghe va
    // broadcast.
    private final ApplicationEventPublisher eventPublisher;
    private final OtpService otpService;

    private static final int HOLD_MINUTES = 10;
    private static final List<BookingStatus> CONFLICT_STATUSES = List.of(
            BookingStatus.HOLDING,
            BookingStatus.CONFIRMED);

    // ============================================================
    // B01 Buoc 3 + AF01: chon ban hoac de he thong goi y
    // ============================================================
    @Override
    @Transactional
    public BookingResponse createHold(User user, CreateHoldRequest req) {
        if (user == null) {
            // Guest bắt buộc phải nhập Email
            if (!StringUtils.hasText(req.getContactEmail())) {
                throw new BusinessException(AuthErrorCode.EMAIL_NOT_NULL);
            }
            // 2. CHECK EMAIL ĐÃ TỒN TẠI TRONG BẢNG USERS CHƯA
            if (userRepository.existsByEmail(req.getContactEmail())) {
                throw new BusinessException(AuthErrorCode.EMAIL_ALREADY_EXISTS);
            }
            // Bắt buộc nhập OTP
            if (!StringUtils.hasText(req.getOtpCode())) {
                throw new BusinessException(AuthErrorCode.OTP_REQUIRED);
            }
            // Verify OTP cho luồng GUEST_BOOKING (Throw exception ngay nếu mã sai/hết hạn)
            otpService.verify(req.getContactEmail(), req.getOtpCode(), OtpPurpose.GUEST_BOOKING);
        }
        // 1. Validate Branch
        Branch branch = branchRepository.findById(req.getBranchId())
                .orElseThrow(() -> new BusinessException(BranchErrorCode.BRANCH_NOT_FOUND));
        // 2. Validate giờ hoạt động
        if (!availableSlotService.isReservationTimeAvailable(req.getBranchId(), req.getReservationTime())) {
            throw new BusinessException(BranchErrorCode.OPERATING_HOUR_NOT_FOUND);
        }
        // 3. Validate bàn
        var requestedTableIds = req.getTableIds().stream().distinct().collect(Collectors.toList());
        if (requestedTableIds.isEmpty()) {
            throw new BusinessException(BookingErrorCode.TABLE_IDS_REQUIRED);
        }
        List<DiningTable> tables = bookingTableService.loadTables(req.getTableIds());
        bookingTableService.validateBookingConflict(req.getTableIds(), req.getReservationTime());
        // 4. Tính trước tổng tiền món ăn đặt trước (Pre-order Total) nếu có
        BigDecimal totalPreorderAmount = BigDecimal.ZERO;
        if (req.getItems() != null && !req.getItems().isEmpty()) {
            totalPreorderAmount = bookingItemService.calculateTotalPreorderAmountFromRequests(req.getItems());
        }
        // 5. Resolve policy + tính tiền cọc
        BranchPolicy branchPolicy = null;
        DepositResult depositResult = new DepositResult(); // Khởi tạo mặc định để tránh null

        try {
            branchPolicy = branchPolicyResolverService.resolve(branch.getId(), req.getReservationTime());
            if (branchPolicy != null) {
                depositResult = branchPolicyResolverService.calculate(
                        branchPolicy,
                        req.getGuestCount(),
                        req.getReservationTime(), totalPreorderAmount);
            } else {
                depositResult.setDepositAmount(BigDecimal.ZERO);
            }
        } catch (BusinessException e) {
            // Nếu bắt được BusinessException, gán tiền cọc về 0
            depositResult = new DepositResult();
            depositResult.setDepositAmount(BigDecimal.ZERO);
        }
        // 6. Check ràng buộc Bàn dựa theo Rule thu được từ Policy
        if (depositResult.getRule() != null) {
            var rule = depositResult.getRule();

            // 6a. Kiểm tra Giới hạn số bàn tối đa
            if (rule.getMaxTables() != null && tables.size() > rule.getMaxTables()) {
                throw new BusinessException(BookingErrorCode.EXCEEDED_MAX_TABLES);
            }

            // 6b. Kiểm tra Sức chứa (Capacity) & Mức chênh lệch ghế cho phép (maxCapacitySlop)
            int totalCapacity = tables.stream().mapToInt(DiningTable::getCapacity).sum();

            if (totalCapacity < req.getGuestCount()) {
                throw new BusinessException(BookingErrorCode.INSUFFICIENT_TABLE_CAPACITY);
            }

            int maxAllowedCapacity = req.getGuestCount() + (rule.getMaxCapacitySlop() != null ? rule.getMaxCapacitySlop() : 2);
            if (totalCapacity > maxAllowedCapacity) {
                throw new BusinessException(BookingErrorCode.EXCEEDED_MAX_CAPACITY_SLOP);
            }
        } else {
            // Fallback kiểm tra capacity cơ bản nếu không khớp rule nào
            bookingTableService.validateTablesGuestCount(tables, req.getGuestCount());
        }
        // 7. Tạo Booking
        Booking booking = bookingMapper.toEntity(req, user, branch);
        boolean isDepositRequired = depositResult.getDepositAmount() != null
                && depositResult.getDepositAmount().compareTo(BigDecimal.ZERO) > 0;

        if (isDepositRequired) {
            booking.setStatus(BookingStatus.HOLDING);
            booking.setHoldExpiresAt(LocalDateTime.now().plusMinutes(HOLD_MINUTES));
            booking.setEstimatedTotal(depositResult.getDepositAmount());
        } else {
            booking.setStatus(BookingStatus.CONFIRMED);
            booking.setHoldExpiresAt(null); // Không giới hạn giữ bàn vì đã xác nhận đơn
            booking.setEstimatedTotal(BigDecimal.ZERO);
        }
        String contactName = StringUtils.hasText(req.getContactName())
                ? req.getContactName()
                : user.getFullName();
        String contactPhone = StringUtils.hasText(req.getContactPhone())
                ? req.getContactPhone()
                : user.getPhone();
        // Giong het contactName/contactPhone: neu request khong gui contactEmail
        // (thanh vien da dang nhap thuong khong bat buoc nhap lai email), fallback
        // ve email tai khoan. Truoc day thieu fallback nay -> tao ra booking co
        // contact_email rong, vi pham @NotBlank cua entity Booking va lam crash
        // scheduled task expireOverdueConfirmedBookings khi Hibernate flush.
        String contactEmail = StringUtils.hasText(req.getContactEmail())
                ? req.getContactEmail()
                : user.getEmail();
        if (!StringUtils.hasText(contactEmail)) {
            throw new BusinessException(AuthErrorCode.EMAIL_NOT_NULL);
        }
        booking.setContactName(contactName);
        booking.setContactPhone(contactPhone);
        booking.setContactEmail(contactEmail);
        booking.setNote(req.getNote());
        // 6. Snapshot policy
        BranchCancellationPolicy cancellationPolicy = branchCancellationPolicyService.loadByBranch(branch.getId());
        booking.setPolicySnapshot(
                branchPolicy != null ? toPolicySnapShotDto(branchPolicy, cancellationPolicy) : new PolicySnapshotDto());
        booking = bookingRepository.save(booking);
        // 7. Lưu bàn
        bookingTableService.saveBookingTables(booking, tables);
        // 8. Lưu món đặt trước (nếu có)
        if (req.getItems() != null && !req.getItems().isEmpty()) {
            bookingItemService.saveItems(booking, req.getItems());
        }
        return bookingMapper.toResponse(booking);
    }

    // ============================================================
    // Nhan khach vang lai (walk-in): tao thang booking CHECKED_IN cho ban
    // dang Trong, khong qua giu ban/dat coc/xac nhan nhu B01.
    // ============================================================
    @Transactional
    public BookingResponse createWalkIn(User staff, CreateWalkInBookingRequest req) {
        // 1. Validate Branch
        Branch branch = branchRepository.findById(req.getBranchId())
                .orElseThrow(() -> new BusinessException(BranchErrorCode.BRANCH_NOT_FOUND));

        // 2. Validate ban - phai dang EMPTY (khac createHold: khong check trung gio
        // hen)
        var tableIds = req.getTableIds().stream().distinct().collect(Collectors.toList());
        if (tableIds.isEmpty()) {
            throw new BusinessException(BookingErrorCode.TABLE_IDS_REQUIRED);
        }
        List<DiningTable> tables = bookingTableService.loadTables(tableIds);
        bookingTableService.validateTablesGuestCount(tables, req.getGuestCount());
        for (DiningTable table : tables) {
            if (table.getStatus() != DiningTableStatus.EMPTY) {
                throw new BusinessException(BookingErrorCode.WALK_IN_TABLE_NOT_EMPTY);
            }
        }

        // 3. Tao Booking - CHECKED_IN ngay, khong qua HOLDING/CONFIRMED, khong dat coc.
        Booking booking = new Booking();
        booking.setBranch(branch);
        booking.setCustomer(staff);
        booking.setReservationTime(LocalDateTime.now());
        booking.setGuestCount(req.getGuestCount().byteValue());
        booking.setStatus(BookingStatus.CHECKED_IN);
        booking.setContactName(StringUtils.hasText(req.getContactName())
                ? req.getContactName()
                : "Khách vãng lai");
        booking.setContactPhone(StringUtils.hasText(req.getContactPhone())
                ? req.getContactPhone()
                : "N/A");
        booking.setContactEmail(StringUtils.hasText(req.getContactEmail())
                ? req.getContactEmail()
                : staff.getEmail());
        booking.setNote(req.getNote());
        booking.setEstimatedTotal(BigDecimal.ZERO);
        // Khach vang lai khong dat coc/khong ap dung chinh sach huy nao -> snapshot
        // "khong co chinh sach"
        // (policy_snapshot dang NOT NULL o DB, khong the de trong).
        booking.setPolicySnapshot(buildNoPolicySnapshot());
        booking = bookingRepository.save(booking);

        // 4. Gan ban + doi trang thai ban sang OCCUPIED ngay
        bookingTableService.saveBookingTables(booking, tables);
        diningTableService.updateStatusForBooking(tableIds, DiningTableStatus.OCCUPIED);
        eventPublisher.publishEvent(new TableBoardChangedEvent(branch.getId(), tableIds));

        return bookingMapper.toResponse(booking);
    }

    private PolicySnapshotDto buildNoPolicySnapshot() {
        return PolicySnapshotDto.builder()
                .policyDepositCode("NONE")
                .policyDepositName("Khách vãng lai - không áp dụng chính sách đặt cọc/huỷ")
                .depositType(DepositType.FIXED)
                .depositValue(BigDecimal.ZERO)
                .minGuest(0)
                .maxGuest(999)
                .build();
    }

    private PolicySnapshotDto toPolicySnapShotDto(
            BranchPolicy branchPolicy,
            BranchCancellationPolicy cancellationPolicy) {

        if (branchPolicy == null && cancellationPolicy == null) {
            return null;
        }

        var policy = (branchPolicy != null) ? branchPolicy.getPolicy() : null;

        // 💡 Lấy phần tử đầu tiên của Deposit Rules (nếu có)
        var firstRule = (branchPolicy != null && branchPolicy.getDepositRules() != null
                && !branchPolicy.getDepositRules().isEmpty())
                ? branchPolicy.getDepositRules().iterator().next()
                : null;

        // 💡 Lấy phần tử đầu tiên của Schedules (nếu có)
        var firstSchedule = (branchPolicy != null && branchPolicy.getSchedules() != null
                && !branchPolicy.getSchedules().isEmpty())
                ? branchPolicy.getSchedules().iterator().next()
                : null;

        return PolicySnapshotDto.builder()
                // --- 1. Thông tin chung từ ReservationPolicy ---
                .policyDepositCode(policy != null ? policy.getPolicyCode() : null)
                .policyDepositName(policy != null ? policy.getName() : null)
                .description(policy != null ? policy.getDescription() : null)
                .termsAndConditions(policy != null ? policy.getTermsAndConditions() : null)

                // --- 2. Thông tin chính sách hủy từ BranchCancellationPolicy (hoặc fallback về
                // policy) ---
                .freeCancellationHours(
                        cancellationPolicy != null ? cancellationPolicy.getFreeCancellationHours() : null)
                .freeRefundPercent(
                        cancellationPolicy != null ? cancellationPolicy.getFreeCancellationRefundPercent() : null)
                .lateRefundPercent(
                        cancellationPolicy != null ? cancellationPolicy.getLateCancellationRefundPercent() : null)
                .noShowRefundPercent(cancellationPolicy != null ? cancellationPolicy.getNoShowRefundPercent() : null)

                // --- 3. Thông tin khung giờ áp dụng từ BranchPolicySchedule ---
                .scheduleType(firstSchedule != null ? policy.getScheduleType() : null)
                .dayOfWeek(firstSchedule != null ? firstSchedule.getDayOfWeek() : null)
                .dateFrom(firstSchedule != null ? firstSchedule.getDateFrom() : null)
                .dateTo(firstSchedule != null ? firstSchedule.getDateTo() : null)
                .timeFrom(firstSchedule != null ? firstSchedule.getTimeFrom() : null)
                .timeTo(firstSchedule != null ? firstSchedule.getTimeTo() : null)

                // --- 4. Thông tin quy định cọc từ BranchPolicyDepositRule ---
                .minGuest(firstRule != null ? firstRule.getMinGuest() : null)
                .maxGuest(firstRule != null ? firstRule.getMaxGuest() : null)
                .maxCapacitySlop(firstRule != null ? firstRule.getMaxCapacitySlop() : null)
                .maxTables(firstRule != null ? firstRule.getMaxTables() : null)
                .depositType(firstRule != null ? firstRule.getDepositType() : null)
                .depositValue(firstRule != null ? firstRule.getDepositValue() : null)
                .minPreorderAmount(firstRule != null ? firstRule.getMinPreorderAmount() : null)
                .build();
    }

    @Override
    public List<BookingResponse> getMyBookings(User user) {
        // 1. Tìm tất cả các booking thuộc về user hiện tại
        List<Booking> bookings = bookingRepository.findByCustomerIdOrderByCreatedAtDesc(user.getId());
        return bookings.stream()
                .map(bookingMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public BookingResponse getBookingDetail(Long bookingId, User user) {
        // 1. Tìm booking theo ID, nếu không thấy thì ném ngoại lệ
        // ResourceNotFoundException
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new BusinessException(BookingErrorCode.BOOKING_NOT_FOUND));
        // 2. Bảo mật: Đảm bảo khách hàng hiện tại chỉ được xem đơn của chính họ
        if (user != null && !booking.getCustomer().getId().equals(user.getId())) {
            throw new BusinessException(AuthErrorCode.ACCESS_DENIED);
        }
        // 3. Map dữ liệu sang BookingResponse DTO
        BookingResponse response = bookingMapper.toResponse(booking);
        // 4. Tính toán các trường động dành riêng cho trang Lock bàn (holdExpiresAt,
        // remainSeconds, paymentAvailable)
        if (booking.getStatus() == BookingStatus.HOLDING || booking.getStatus() == BookingStatus.AWAITING_PAYMENT) {
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime expiresAt = booking.getHoldExpiresAt(); // Giả sử bảng Booking có trường lưu thời gian hết hạn
            // giữ bàn
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

    public List<BookingResponse> getBookingsByEmail(String email) {
        // Truy vấn DB lấy các booking theo email của khách
        var bookings = bookingRepository.findByContactEmailOrderByCreatedAtDesc(email);
        // Map sang DTO trả về cho Client
        return bookings.stream()
                .map(bookingMapper::toResponse) // Dùng method reference cho gọn
                .toList();
    }

    /**
     * AF01: he thong de xuat ban dua tren so khach va tinh trang hien co.
     */
    // private RestaurantTable suggestTable(Long branchId, Integer guestCount,
    // LocalDateTime reservationTime) {
    // List<RestaurantTable> candidates =
    // tableRepository.findByZoneBranchId(branchId).stream()
    // .filter(t -> t.getStatus() == TableStatus.AVAILABLE)
    // .filter(t -> t.getCapacity() >= guestCount)
    // .sorted(Comparator.comparingInt(RestaurantTable::getCapacity)) // uu tien ban
    // vua du, tranh lang phi
    // .collect(Collectors.toList());

    // ============================================================
    // B08: nhan vien check-in cho khach da xac nhan / nghi no-show
    // ============================================================
    @Override
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
    // B12: nhan vien xac nhan da thu tien roi check-out sau khi khach dung
    // bua xong. Truoc khi doi status/ban, tao va luu hoa don (rs_invoices)
    // qua InvoiceService - neu booking nay da co hoa don (checkout goi
    // trung/lai) se nem INVOICE_ALREADY_PAID va KHONG doi status ban.
    // ============================================================
    @Override
    @Transactional
    public BookingResponse checkOut(Long bookingId, ConfirmCheckoutRequest request, User collector) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new BusinessException(BookingErrorCode.BOOKING_NOT_FOUND));
        if (booking.getStatus() != BookingStatus.CHECKED_IN) {
            throw new BusinessException(BookingErrorCode.BOOKING_CANNOT_CHECK_OUT);
        }
        if (request == null || request.getPaymentMethod() == null) {
            throw new BusinessException(InvoiceErrorCode.PAYMENT_METHOD_REQUIRED);
        }

        invoiceService.createInvoiceForCheckout(booking, request, collector);

        booking.setStatus(BookingStatus.COMPLETED);
        booking = bookingRepository.save(booking);
        applyTableStatus(booking, DiningTableStatus.CLEANING);
        return bookingMapper.toResponse(booking);
    }

    // ============================================================
    // Xem truoc hoa don TRUOC khi xac nhan thanh toan (khong ghi DB) - dung
    // cho modal "Thanh toan hoa don" o Tab Goi mon.
    // ============================================================
    @Override
    public InvoicePreviewResponse previewInvoice(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new BusinessException(BookingErrorCode.BOOKING_NOT_FOUND));
        if (booking.getStatus() != BookingStatus.CHECKED_IN) {
            throw new BusinessException(BookingErrorCode.BOOKING_CANNOT_CHECK_OUT);
        }
        return invoiceService.preview(booking);
    }

    // ============================================================
    // B11: nhan vien chot No-show cho don da xac nhan / dang nghi ngo
    // ============================================================
    @Override
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
    // B11: huy don - tu khach (cancelledByRestaurant=false) hoac tu nha hang
    // (=true)
    // Chi cho huy khi don CHUA check-in. Da
    // CHECKED_IN/COMPLETED/CANCELLED*/NO_SHOW/EXPIRED
    // deu khong the huy nua.
    // ============================================================
    @Override
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
        // TODO: neu request.getReason() can luu lai, hien Booking entity chua co cot
        // rieng
        // cho ly do huy - can bo sung cot (vd cancel_reason) neu nghiep vu yeu cau hien
        // thi lai.
        booking = bookingRepository.save(booking);
        applyTableStatus(booking, DiningTableStatus.CLEANING);
        return bookingMapper.toResponse(booking);
    }

    /**
     * Doi trang thai tat ca ban gan voi 1 booking (1 booking co the co nhieu ban
     * qua rs_reservation_tables) theo dung bang transition da chot voi doi tac:
     * CONFIRMED -> RESERVED (chua lam, thuoc luong xac nhan/thanh toan - TODO
     * rieng),
     * CHECKED_IN -> OCCUPIED, COMPLETED/NO_SHOW/CANCELLED_* / EXPIRED -> CLEANING.
     */
    private void applyTableStatus(Booking booking, DiningTableStatus status) {
        List<Long> tableIds = booking.getBookingTables().stream()
                .map(bt -> bt.getDiningTable().getId())
                .toList();
        diningTableService.updateStatusForBooking(tableIds, status);
        // Task 5: bao cho Tab Goi Mon realtime - listener se broadcast qua STOMP
        // SAU KHI transaction nay commit thanh cong (xem @TransactionalEventListener).
        eventPublisher.publishEvent(new TableBoardChangedEvent(booking.getBranch().getId(), tableIds));
    }

    // ============================================================
    // EF04: tu dong huy don het han giu ban (chay dinh ky)
    // ============================================================
    @Override
    @Transactional
    public void expireOverdueHoldings() {
        List<Booking> expired = bookingRepository.findExpiredHoldings(LocalDateTime.now());
        for (Booking booking : expired) {
            booking.setStatus(BookingStatus.EXPIRED);
            bookingRepository.save(booking);
        }
    }

    // ============================================================
    // B11 buoc 5-7 (rut gon, tu dong): CONFIRMED da qua gio hen + 1 khoang dem
    // se tu chuyen sang NO_SHOW - chay dinh ky cung nhip voi expireOverdueHoldings().
    // Truoc day CHI co markNoShow() cho nhan vien bam tay, khong co tien trinh
    // tu dong nao ca -> booking qua gio hen "treo" o CONFIRMED mai mai, khien
    // OrderBoardService van hien no la active booking cua ban du gio da qua rat lau.
    // NO_SHOW_GRACE_MINUTES: cho khach mot khoang tre nho truoc khi chot no-show,
    // tranh vua qua gio hen 1 phut da bi huy oan - dieu chinh so nay neu can.
    // ============================================================
    private static final long NO_SHOW_GRACE_MINUTES = 30;

    @Override
    @Transactional
    public void expireOverdueConfirmedBookings() {
        LocalDateTime threshold = LocalDateTime.now().minusMinutes(NO_SHOW_GRACE_MINUTES);
        List<Booking> overdue = bookingRepository.findOverdueUncheckedIn(threshold);
        for (Booking booking : overdue) {
            booking.setStatus(BookingStatus.NO_SHOW);
            booking = bookingRepository.save(booking);
            applyTableStatus(booking, DiningTableStatus.CLEANING);
        }
    }

    // // ============================================================
    // // Helpers
    // // ============================================================
    // private Booking getOwnedBooking(Long bookingId, Long customerId) {
    // Booking booking = bookingRepository.findById(bookingId)
    // .orElseThrow(() -> new BusinessException("BOOKING_NOT_FOUND", "Khong tim thay
    // don dat ban"));
    // if (!booking.getCustomer().getId().equals(customerId)) {
    // throw new BusinessException("FORBIDDEN", "Ban khong co quyen voi don dat ban
    // nay");
    // }
    // return booking;
    // }
    //
    // private void ensureHoldingNotExpired(Booking booking) {
    // if (booking.getStatus() != BookingStatus.HOLDING) {
    // throw new BusinessException("INVALID_STATE", "Don khong o trang thai cho xu
    // ly");
    // }
    // if (booking.getHoldExpiresAt().isBefore(LocalDateTime.now())) {
    // throw new BusinessException("HOLD_EXPIRED", "Da het thoi gian giu ban
    // (EF04)");
    // }
    // }
    //
    // public BookingResponse toResponse(Booking booking) {
    // BigDecimal totalPreOrder = booking.getItems().stream()
    // .map(i -> i.getSnapshotPrice().multiply(BigDecimal.valueOf(i.getQuantity())))
    // .reduce(BigDecimal.ZERO, BigDecimal::add);
    //
    // return BookingResponse.builder()
    // .id(booking.getId())
    // .branchName(booking.getBranch().getName())
    // .tableCode(booking.getTable().getTableCode())
    // .guestCount(booking.getGuestCount())
    // .reservationTime(booking.getReservationTime())
    // .holdExpiresAt(booking.getHoldExpiresAt())
    // .status(booking.getStatus().name())
    // .depositAmount(booking.getSnapshotDepositAmount())
    // .totalPreOrderAmount(totalPreOrder)
    // .items(booking.getItems().stream()
    // .map(i -> BookingItemResponse.builder()
    // .name(i.getSnapshotName())
    // .price(i.getSnapshotPrice())
    // .quantity(i.getQuantity())
    // .build())
    // .collect(Collectors.toList()))
    // .build();
    // }
}