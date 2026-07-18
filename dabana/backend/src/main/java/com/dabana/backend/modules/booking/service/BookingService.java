package com.dabana.backend.modules.booking.service;

import com.dabana.backend.exception.BusinessException;
import com.dabana.backend.modules.auth.repository.UserRepository;
import com.dabana.backend.modules.booking.dto.BookingDtos;
import com.dabana.backend.modules.booking.dto.BookingDtos.BookingItemResponse;
import com.dabana.backend.modules.booking.dto.BookingDtos.PreOrderRequest;
import com.dabana.backend.modules.booking.dto.BookingDtos.ReservationConfirmResponse;
import com.dabana.backend.modules.booking.dto.BookingDtos.ReservationDetailResponse;
import com.dabana.backend.modules.booking.dto.BookingDtos.ReservationHoldRequest;
import com.dabana.backend.modules.booking.dto.BookingDtos.ReservationHoldResponse;
import com.dabana.backend.modules.booking.entity.Booking;
import com.dabana.backend.modules.booking.entity.BookingItem;
import com.dabana.backend.modules.booking.entity.BookingTable;
import com.dabana.backend.modules.booking.repository.BookingRepository;
import com.dabana.backend.modules.booking.util.BookingStatus;
import com.dabana.backend.modules.diningtable.entity.DiningTable;
import com.dabana.backend.modules.diningtable.repository.DiningTableRepository;
import com.dabana.backend.modules.diningtable.util.DiningTableStatus;
import com.dabana.backend.modules.menu.entity.MenuItem;
import com.dabana.backend.modules.menu.repository.MenuItemRepository;
import com.dabana.backend.modules.menu.util.MenuItemStatus;
import com.dabana.backend.modules.branch2.entity.Branch;
import com.dabana.backend.modules.branch2.repository.BranchRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookingService {

    private static final int HOLD_MINUTES = 10;
    private static final List<BookingStatus> CONFLICT_STATUSES = List.of(
            BookingStatus.HOLDING,
            BookingStatus.CONFIRMED
    );

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final BranchRepository branchRepository;
    private final DiningTableRepository diningTableRepository;
    private final MenuItemRepository menuItemRepository;

    @Transactional
    public ReservationHoldResponse holdReservation(Long currentUserId, ReservationHoldRequest request) {
        var user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new BusinessException("USER_NOT_FOUND", "Người dùng không tồn tại"));

        var branch = branchRepository.findById(request.getBranchId())
                .orElseThrow(() -> new BusinessException("BRANCH_NOT_FOUND", "Chi nhánh không tồn tại"));

        var requestedTableIds = request.getTableIds().stream().distinct().collect(Collectors.toList());
        if (requestedTableIds.isEmpty()) {
            throw new BusinessException("TABLE_IDS_REQUIRED", "Phải cung cấp danh sách table_ids");
        }

        if (bookingRepository.existsByTableIdInAndReservationTimeAndStatusIn(
                requestedTableIds,
                request.getReservationTime(),
                CONFLICT_STATUSES)) {
            throw new BusinessException("RESERVATION_CONFLICT",
                    "Một hoặc nhiều bàn đã bị đặt trong cùng khung giờ");
        }

        List<DiningTable> tables = diningTableRepository.findAllById(requestedTableIds);
        if (tables.size() != requestedTableIds.size()) {
            throw new BusinessException("TABLE_NOT_FOUND", "Không tìm thấy một hoặc nhiều bàn yêu cầu");
        }

        for (DiningTable table : tables) {
            if (!table.getZone().getBranch().getId().equals(branch.getId())) {
                throw new BusinessException("TABLE_BRANCH_MISMATCH", "Bàn không thuộc chi nhánh yêu cầu");
            }
            if (table.getStatus() == DiningTableStatus.RESERVED || table.getStatus() == DiningTableStatus.OCCUPIED) {
                throw new BusinessException("TABLE_UNAVAILABLE", "Một hoặc nhiều bàn hiện không khả dụng");
            }
        }

        Booking booking = new Booking();
        booking.setUser(user);
        booking.setBranch(branch);
        booking.setReservationTime(request.getReservationTime());
        booking.setGuestCount(request.getGuestCount());
        booking.setStatus(BookingStatus.HOLDING);
        booking.setHoldExpiresAt(LocalDateTime.now().plusMinutes(HOLD_MINUTES));
        booking.setEstimatedTotal(BigDecimal.ZERO);

        for (DiningTable table : tables) {
            BookingTable bookingTable = new BookingTable();
            bookingTable.setBooking(booking);
            bookingTable.setDiningTable(table);
            booking.getBookingTables().add(bookingTable);
        }

        bookingRepository.save(booking);
        return ReservationHoldResponse.builder()
                .reservationId(booking.getId())
                .holdExpiresAt(booking.getHoldExpiresAt())
                .build();
    }

    @Transactional
    public ReservationDetailResponse addPreOrderItems(Long reservationId, PreOrderRequest request) {
        Booking booking = bookingRepository.findById(reservationId)
                .orElseThrow(() -> new BusinessException("RESERVATION_NOT_FOUND", "Không tìm thấy đơn đặt bàn"));

        if (booking.getStatus() != BookingStatus.HOLDING) {
            throw new BusinessException("INVALID_STATE", "Đơn đặt bàn không ở trạng thái holding");
        }

        if (booking.getHoldExpiresAt().isBefore(LocalDateTime.now())) {
            booking.setStatus(BookingStatus.EXPIRED);
            bookingRepository.save(booking);
            throw new BusinessException("HOLD_EXPIRED", "Thời gian giữ bàn đã hết hạn");
        }

        if (request.getItems() == null || request.getItems().isEmpty()) {
            booking.setEstimatedTotal(BigDecimal.ZERO);
            bookingRepository.save(booking);
            return buildReservationDetailResponse(booking);
        }

        for (var itemRequest : request.getItems()) {
            MenuItem menuItem = menuItemRepository.findById(itemRequest.getMenuItemId())
                    .orElseThrow(() -> new BusinessException("MENU_ITEM_NOT_FOUND", "Không tìm thấy món ăn"));

            if (menuItem.getStatus() != MenuItemStatus.SELLING) {
                throw new BusinessException("MENU_ITEM_NOT_AVAILABLE",
                        "Món ăn '" + menuItem.getName() + "' hiện không bán");
            }

            BookingItem item = new BookingItem();
            item.setBooking(booking);
            item.setMenuItem(menuItem);
            item.setSnapshotName(menuItem.getName());
            item.setSnapshotPrice(menuItem.getPrice());
            item.setQuantity(itemRequest.getQuantity());
            item.setIsWalkInOrder(false);
            booking.getItems().add(item);
        }

        booking.setEstimatedTotal(calculateEstimatedTotal(booking));
        bookingRepository.save(booking);
        return buildReservationDetailResponse(booking);
    }

    @Transactional
    public ReservationConfirmResponse confirmReservation(Long reservationId) {
        Booking booking = bookingRepository.findById(reservationId)
                .orElseThrow(() -> new BusinessException("RESERVATION_NOT_FOUND", "Không tìm thấy đơn đặt bàn"));

        if (booking.getStatus() != BookingStatus.HOLDING) {
            throw new BusinessException("INVALID_STATE", "Đơn đặt bàn không ở trạng thái holding");
        }

        if (booking.getHoldExpiresAt().isBefore(LocalDateTime.now())) {
            booking.setStatus(BookingStatus.EXPIRED);
            bookingRepository.save(booking);
            throw new BusinessException("HOLD_EXPIRED", "Thời gian giữ bàn đã hết hạn và bàn đã được giải phóng");
        }

        booking.setStatus(BookingStatus.CONFIRMED);
        bookingRepository.save(booking);

        return ReservationConfirmResponse.builder()
                .reservationId(booking.getId())
                .status(booking.getStatus().name())
                .build();
    }

    private BigDecimal calculateEstimatedTotal(Booking booking) {
        return booking.getItems().stream()
                .map(item -> item.getSnapshotPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private ReservationDetailResponse buildReservationDetailResponse(Booking booking) {
        return ReservationDetailResponse.builder()
                .reservationId(booking.getId())
                .status(booking.getStatus().name())
                .estimatedTotal(booking.getEstimatedTotal() == null ? BigDecimal.ZERO : booking.getEstimatedTotal())
                .items(booking.getItems().stream()
                        .map(item -> BookingItemResponse.builder()
                                .name(item.getSnapshotName())
                                .price(item.getSnapshotPrice())
                                .quantity(item.getQuantity())
                                .build())
                        .collect(Collectors.toList()))
                .build();
    }
}
