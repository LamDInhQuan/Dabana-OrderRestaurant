package com.dabana.backend.modules.booking.service;

import com.dabana.backend.common.BaseEntity;
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
import com.dabana.backend.modules.booking.event.BookingCancelledForRefundEvent;
import com.dabana.backend.modules.booking.dto.response.CustomerResponse;
import com.dabana.backend.modules.booking.event.BookingTableChangedEvent;
import com.dabana.backend.modules.booking.mapper.BookingMapper;
import com.dabana.backend.modules.booking.util.CancelledBy;
import com.dabana.backend.modules.booking.util.RefundStatus;
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
import com.dabana.backend.modules.notification.NotificationService;
import com.dabana.backend.modules.notification.NotificationType;
import com.dabana.backend.modules.orderboard.event.TableBoardChangedEvent;
import com.dabana.backend.modules.diningtable.entity.DiningTable;
import com.dabana.backend.modules.diningtable.repository.DiningTableRepository;
import com.dabana.backend.modules.diningtable.util.DiningTableStatus;
import com.dabana.backend.modules.invoice.dto.request.ConfirmCheckoutRequest;
import com.dabana.backend.modules.invoice.dto.response.InvoicePreviewResponse;
import com.dabana.backend.modules.invoice.service.IInvoiceService;
import com.dabana.backend.modules.invoice.util.InvoiceErrorCode;
import com.dabana.backend.modules.payment.entity.DepositPayment;
import com.dabana.backend.modules.payment.repository.DepositPaymentRepository;
import com.dabana.backend.modules.payment.util.DepositPaymentStatus;
import com.dabana.backend.modules.reservation_policy.dto.DepositResult;
import com.dabana.backend.modules.reservation_policy.entity.BranchPolicy;
import com.dabana.backend.modules.reservation_policy.service.BranchPolicyResolverService;
import com.dabana.backend.modules.reservation_policy.util.DepositType;
import com.dabana.backend.modules.review.ReviewRepository;
import com.dabana.backend.modules.review.service.IReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
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
    private final BranchCancellationPolicyRepository branchCancellationPolicyRepository;
    private final IInvoiceService invoiceService;
    private final DepositPaymentRepository depositPaymentRepository;
    private final ReviewRepository reviewRepository;
    // Task 5: chi publish event noi bo (khong biet gi ve WebSocket/STOMP) - xem
    // OrderBoardWebSocketListener (module orderboard) de biet noi lang nghe va
    // broadcast.
    private final ApplicationEventPublisher eventPublisher;
    private final OtpService otpService;
    private final NotificationService notificationService; // B09: gui thong bao cho cac su kien cua B01/B11/B12

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

        // 5. Resolve policy + tính tiền cọc (Loại bỏ try-catch nuốt lỗi ngầm, dùng Optional / check an toàn)
        BranchPolicy branchPolicy = branchPolicyResolverService.resolve(branch.getId(), req.getReservationTime());
        DepositResult depositResult;

        if (branchPolicy != null) {
            depositResult = branchPolicyResolverService.calculate(
                    branchPolicy,
                    req.getGuestCount(),
                    req.getReservationTime(),
                    totalPreorderAmount
            );
        } else {
            depositResult = new DepositResult(null, BigDecimal.ZERO);
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
            booking.setHoldExpiresAt(null);
            booking.setEstimatedTotal(BigDecimal.ZERO);
        }

        String contactName = StringUtils.hasText(req.getContactName())
                ? req.getContactName()
                : user.getFullName();
        String contactPhone = StringUtils.hasText(req.getContactPhone())
                ? req.getContactPhone()
                : user.getPhone();
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

        // 8. Snapshot policy
        // Luu y: KHONG duoc goi branchCancellationPolicyService.loadByBranch(...) o day.
        // Method do nam trong 1 bean @Transactional khac; khi branch chua co
        // BranchCancellationPolicy, no throw BusinessException (RuntimeException) ngay
        // trong nested transaction (propagation REQUIRED = dung chung transaction vat ly
        // voi createHold). Spring se danh dau transaction hien tai la rollback-only ngay
        // tai thoi diem do, DU cho exception bi catch va nuot o day. Ket qua: createHold
        // van chay tiep va return binh thuong, nhung khi commit, Spring phat hien
        // rollback-only flag va nem UnexpectedRollbackException thay vi commit
        // => loi 500 dù toan bo logic phia tren da chay dung.
        // Fix: query truc tiep qua repository (tra ve Optional, khong throw) de tranh
        // vuot qua ranh gioi @Transactional bang exception.
        PolicySnapshotDto policySnapshot = new PolicySnapshotDto();
        if (branchPolicy != null) {
            BranchCancellationPolicy cancellationPolicy = branchCancellationPolicyRepository
                    .findByBranchId(branch.getId())
                    .orElse(null);
            policySnapshot = toPolicySnapShotDto(branchPolicy, cancellationPolicy);
        }
        booking.setPolicySnapshot(policySnapshot);
        booking.setReservationTime(req.getReservationTime());
        booking = bookingRepository.save(booking);

        // 9. Lưu bàn
        bookingTableService.saveBookingTables(booking, tables);

        // 10. Lưu món đặt trước (nếu có)
        if (req.getItems() != null && !req.getItems().isEmpty()) {
            bookingItemService.saveItems(booking, req.getItems());
        }

        // 11. B09 BR01: neu khong can coc, don da CONFIRMED ngay - gui xac nhan
        // tuc thi. Truong hop can coc (HOLDING), xac nhan se duoc gui sau khi
        // coc PAID, xem PayosWebhookService.
        if (booking.getStatus() == BookingStatus.CONFIRMED) {
            String content = String.format(
                    "Đặt bàn thành công tại %s lúc %s.",
                    branch.getName(), booking.getReservationTime());
            notifyCustomer(booking, NotificationType.BOOKING_CONFIRMED, content);

            String restaurantContent = String.format(
                    "Có đơn đặt bàn mới tại %s lúc %s từ khách hàng %s.",
                    branch.getName(), booking.getReservationTime(), booking.getContactName());
            notifyRestaurant(booking, NotificationType.BOOKING_CONFIRMED, restaurantContent);
        }
        // Ví dụ gom nhóm các bàn theo Zone ID trong Java Service
        List<Long> zoneIds = tables.stream()
                .map(t -> t.getZone().getId())
                .distinct()
                .toList();

// Hoặc nếu muốn lấy riêng danh sách ID của các bàn
        List<Long> tableIds = tables.stream()
                .map(BaseEntity::getId) // hoặc item -> item.getId()
                .toList();
        eventPublisher.publishEvent(
                new BookingTableChangedEvent(
                        booking.getStatus(),
                        tableIds,
                        booking.getId(),
                        booking.getBranch().getId(),
                        booking.getCustomer().getId().longValue(),
                        req.getReservationTime(),
                        zoneIds ,
                        booking.getContactEmail()
                )
        );

        eventPublisher.publishEvent(new BookingChangedEvent(booking.getBranch().getId(), booking.getCustomer() != null ? booking.getCustomer().getId().longValue() : 0L, booking.getId()));
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
        booking.setReservationTime(LocalDateTime.now());
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

        if (bookings.isEmpty()) {
            return Collections.emptyList();
        }

        // 2. Lấy danh sách các booking_id mà user này đã đánh giá (Chỉ 1 câu query duy nhất)
        List<Long> reviewedBookingIds = reviewRepository.findReviewedBookingIdsByCustomerId(user.getId());
        // Đưa vào Set để tối ưu hóa tốc độ kiểm tra (O(1) thay vì O(N))
        Set<Long> reviewedSet = new HashSet<>(reviewedBookingIds);
        // 3. Map sang BookingResponse và gán giá trị cho isReviewed
        return bookings.stream().map(booking -> {
            BookingResponse response = bookingMapper.toResponse(booking);
            // Kiểm tra xem booking này đã có trong bảng review chưa
            response.setIsReviewed(reviewedSet.contains(booking.getId()));
            return response;
        }).collect(Collectors.toList());
    }

    @Override
    public BookingResponse getBookingDetail(Long bookingId, User user) {
        // 1. Tìm booking theo ID, nếu không thấy thì ném ngoại lệ ResourceNotFoundException
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new BusinessException(BookingErrorCode.BOOKING_NOT_FOUND));

        // 2. Bảo mật: Đảm bảo khách hàng hiện tại chỉ được xem đơn của chính họ
        if (user != null && !booking.getCustomer().getId().equals(user.getId())) {
            throw new BusinessException(AuthErrorCode.ACCESS_DENIED);
        }

        // 3. Map dữ liệu sang BookingResponse DTO
        BookingResponse response = bookingMapper.toResponse(booking);

        // 4. Kiểm tra trạng thái đánh giá (isReviewed) cho riêng booking này
        if (user != null) {
            boolean isReviewed = reviewRepository.existsByBookingId(bookingId);
            // Hoặc nếu bạn muốn tận dụng lại câu query tập hợp hoặc viết query check tồn tại, ví dụ:
            // boolean isReviewed = reviewRepository.existsByBookingId(bookingId);
            response.setIsReviewed(isReviewed);
        } else {
            response.setIsReviewed(false);
        }

        // 5. Tính toán các trường động dành riêng cho trang Lock bàn (holdExpiresAt, remainSeconds, paymentAvailable)
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

        // B09: moi khach danh gia sau khi don hoan tat (B13)
        notifyCustomer(booking, NotificationType.REVIEW_INVITATION,
                String.format("Cảm ơn bạn đã dùng bữa tại %s. Hãy đánh giá trải nghiệm của bạn!",
                        booking.getBranch().getName()));

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

        // B09: bao ket qua no-show cho khach (B11 buoc 8)
        notifyCustomer(booking, NotificationType.NO_SHOW_WARNING,
                String.format("Đơn đặt bàn tại %s lúc %s đã được ghi nhận là không đến (no-show).",
                        booking.getBranch().getName(), booking.getReservationTime()));

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
        booking.setCancelledBy(byRestaurant ? CancelledBy.STAFF : CancelledBy.CUSTOMER);
        booking.setCancelledAt(LocalDateTime.now());
        booking.setCancelReason(request != null ? request.getReason() : null);

        applyCancellationRefundPolicy(booking);

        booking = bookingRepository.save(booking);
        // Huy don (truoc khi khach check-in) -> ban CHUA TUNG co khach ngoi, nen
        // tra thang ve EMPTY de co the nhan khach moi ngay, KHONG phai CLEANING
        // (CLEANING chi danh cho ban DA thuc su duoc su dung - xem checkOut()/
        // markNoShow() o tren, noi khach da/co the da ngoi vao ban).
        applyTableStatus(booking, DiningTableStatus.EMPTY);

        // Tu dong hoan coc: neu policy tinh ra refundStatus=PENDING (co tien de hoan),
        // publish event de PayoutAutoCreateListener (module payment) tu goi payOS
        // tao lenh chi NGAY SAU KHI transaction nay commit - khong can nhan vien bam
        // nut thu cong nua. Publish TRUOC KHI return, nhung listener chi chay o
        // AFTER_COMMIT nen an toan neu phan con lai cua method nay loi/rollback.
        if (booking.getRefundStatus() == RefundStatus.PENDING) {
            eventPublisher.publishEvent(new BookingCancelledForRefundEvent(booking.getId()));
        }

        // B09: bao ket qua huy don (va hoan coc neu co) cho khach (B11)
        String cancelContent = byRestaurant
                ? String.format("Nhà hàng %s đã hủy đơn đặt bàn của bạn lúc %s.",
                booking.getBranch().getName(), booking.getReservationTime())
                : String.format("Đơn đặt bàn tại %s lúc %s đã được hủy thành công.",
                booking.getBranch().getName(), booking.getReservationTime());
        if (booking.getRefundStatus() == RefundStatus.PENDING) {
            cancelContent += String.format(" Số tiền hoàn cọc: %s VND.", booking.getRefundAmount());
        }
        notifyCustomer(booking, NotificationType.BOOKING_CANCELLED, cancelContent);

        if (!byRestaurant) {
            String restaurantContent = String.format("Khách hàng %s đã huỷ đơn đặt bàn tại %s lúc %s.",
                    booking.getContactName(), booking.getBranch().getName(), booking.getReservationTime());
            notifyRestaurant(booking, NotificationType.BOOKING_CANCELLED, restaurantContent);
        }

        return bookingMapper.toResponse(booking);
    }

    /**
     * BR: Tinh so tien hoan coc khi huy don, dua tren policySnapshot da luu
     * NGAY LUC TAO booking (KHONG doc lai BranchCancellationPolicy hien tai cua
     * chi nhanh - vi chinh sach co the da thay doi sau khi khach dat, phai tinh
     * theo chinh sach da cam ket voi khach luc dat ban).
     * <p>
     * - Neu chua co lenh coc nao PAID -> khong co gi de hoan (refundStatus=NONE).
     * - Neu huy tu luc con >= freeCancellationHours gio truoc gio hen -> ap dung
     * freeRefundPercent (thuong 100%).
     * - Neu huy trong khoang duoi freeCancellationHours gio -> ap dung
     * lateRefundPercent (thuong < 100%, phan con lai la penaltyAmount).
     * - Ket qua duoc luu vao Booking.refundAmount/penaltyAmount/refundStatus=PENDING,
     * PayoutOrderService se doc refundAmount nay de tao lenh chi qua payOS.
     */
    private void applyCancellationRefundPolicy(Booking booking) {
        Optional<DepositPayment> paidDepositOpt = depositPaymentRepository
                .findByReservation_IdAndStatus(booking.getId(), DepositPaymentStatus.PAID);

        if (paidDepositOpt.isEmpty()) {
            booking.setRefundAmount(BigDecimal.ZERO);
            booking.setPenaltyAmount(BigDecimal.ZERO);
            booking.setRefundStatus(RefundStatus.NONE);
            return;
        }

        BigDecimal paidAmount = paidDepositOpt.get().getAmountPaid();
        BigDecimal refundPercent = resolveRefundPercent(booking, booking.getPolicySnapshot());

        BigDecimal refundAmount = paidAmount
                .multiply(refundPercent)
                .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);
        // Chan an toan: khong bao gio hoan qua so tien da thu, du policy nhap sai > 100%.
        if (refundAmount.compareTo(paidAmount) > 0) {
            refundAmount = paidAmount;
        }
        if (refundAmount.compareTo(BigDecimal.ZERO) < 0) {
            refundAmount = BigDecimal.ZERO;
        }

        booking.setRefundAmount(refundAmount);
        booking.setPenaltyAmount(paidAmount.subtract(refundAmount));
        booking.setRefundStatus(refundAmount.compareTo(BigDecimal.ZERO) > 0 ? RefundStatus.PENDING : RefundStatus.NONE);
    }

    /**
     * % hoan tien ap dung, dua tren khoang cach tu luc huy toi gio hen (reservationTime).
     */
    private BigDecimal resolveRefundPercent(Booking booking, PolicySnapshotDto policy) {
        if (policy == null || policy.getFreeCancellationHours() == null) {
            // Khong co snapshot chinh sach huy (vd du lieu cu truoc khi co tinh nang
            // nay, hoac booking khach vang lai) -> khong tu y hoan tien khi khong ro
            // chinh sach, de nhan vien xu ly thu cong.
            return BigDecimal.ZERO;
        }

        long hoursBeforeReservation = Duration.between(LocalDateTime.now(), booking.getReservationTime()).toHours();
        boolean isFreeCancellation = hoursBeforeReservation >= policy.getFreeCancellationHours();

        BigDecimal percent = isFreeCancellation ? policy.getFreeRefundPercent() : policy.getLateRefundPercent();
        return percent != null ? percent : BigDecimal.ZERO;
    }

    /**
     * Doi trang thai tat ca ban gan voi 1 booking (1 booking co the co nhieu ban
     * qua rs_reservation_tables) theo dung bang transition da chot voi doi tac:
     * CONFIRMED -> RESERVED (chua lam, thuoc luong xac nhan/thanh toan - TODO
     * rieng),
     * CHECKED_IN -> OCCUPIED, COMPLETED/NO_SHOW/EXPIRED -> CLEANING,
     * CANCELLED_BY_CUSTOMER/CANCELLED_BY_RESTAURANT -> EMPTY (ban chua tung
     * co khach ngoi nen khong can dọn, tra trong lai ngay - xem cancel()).
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

    /**
     * B09: gui thong bao (in-app) cho khach hang gan voi mot booking.
     * Khach vang lai (dat ban khong co tai khoan User, booking.customer = null)
     * hien chua co co che gui thong bao vi Notification.recipient bat buoc la
     * mot User - bo qua trong truong hop nay thay vi lam loi ca luong nghiep vu goc.
     */
    private void notifyCustomer(Booking booking, NotificationType type, String content) {
        if (booking == null || booking.getCustomer() == null) {
            return;
        }
        notificationService.sendImmediate(booking.getCustomer(), type, content, "IN_APP", booking.getBranch().getId());
    }

    private void notifyRestaurant(Booking booking, NotificationType type, String content) {
        if (booking.getBranch() != null && booking.getBranch().getRestaurant() != null && booking.getBranch().getRestaurant().getOwner() != null) {
            notificationService.sendImmediate(booking.getBranch().getRestaurant().getOwner(), type, content, "IN_APP", booking.getBranch().getId());
        }
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

            // B09: bao ket qua no-show cho khach (tu dong chot, khong co xac nhan nhan vien)
            notifyCustomer(booking, NotificationType.NO_SHOW_WARNING,
                    String.format("Đơn đặt bàn tại %s lúc %s đã được ghi nhận là không đến (no-show).",
                            booking.getBranch().getName(), booking.getReservationTime()));
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


    @Override
    public List<CustomerResponse> getListCustomerByBranch(Long branchId, String keyword) {
        return bookingRepository.getBranchCustomersStats(branchId, keyword);
    }
}