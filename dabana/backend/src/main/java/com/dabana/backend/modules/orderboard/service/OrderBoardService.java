package com.dabana.backend.modules.orderboard.service;

import com.dabana.backend.exception.BusinessException;
import com.dabana.backend.modules.booking.Booking;
import com.dabana.backend.modules.booking.BookingItem;
import com.dabana.backend.modules.booking.BookingStatus;
import com.dabana.backend.modules.booking.BookingTable;
import com.dabana.backend.modules.booking.repository.BookingItemRepository;
import com.dabana.backend.modules.booking.repository.BookingTableRepository;
import com.dabana.backend.modules.branch2.repository.BranchRepository;
import com.dabana.backend.modules.diningtable.entity.DiningTable;
import com.dabana.backend.modules.diningtable.repository.DiningTableRepository;
import com.dabana.backend.modules.diningtable.util.DiningTableErrorCode;
import com.dabana.backend.modules.extraorder.entity.ExtraOrder;
import com.dabana.backend.modules.extraorder.repository.ExtraOrderRepository;
import com.dabana.backend.modules.orderboard.dto.response.ActiveBookingResponse;
import com.dabana.backend.modules.orderboard.dto.response.BranchBoardResponse;
import com.dabana.backend.modules.orderboard.dto.response.OrderItemResponse;
import com.dabana.backend.modules.orderboard.dto.response.TableBoardResponse;
import com.dabana.backend.modules.orderboard.dto.response.ZoneBoardResponse;
import com.dabana.backend.modules.orderboard.util.OrderSource;
import com.dabana.backend.modules.zone.entity.Zone;
import com.dabana.backend.modules.zone.repository.ZoneRepository;
import com.dabana.backend.modules.zone.util.ZoneErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Tab Goi Mon:
 * - Task 4: API danh sach ban + don hang realtime (getBoard).
 * - Task 5: build lai TableBoardResponse cho 1 tap tableId cu the
 * (getTableBoards), dung boi OrderBoardWebSocketListener de broadcast
 * qua STOMP moi khi co TableBoardChangedEvent.
 */
@Service
@RequiredArgsConstructor
public class OrderBoardService implements IOrderBoardService {

    private static final List<BookingStatus> ACTIVE_BOOKING_STATUSES =
            List.of(BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN);
    private static final long ACTIVE_BOOKING_LEAD_MINUTES = 180;

    private final BranchRepository branchRepository;
    private final ZoneRepository zoneRepository;
    private final DiningTableRepository diningTableRepository;
    private final BookingTableRepository bookingTableRepository;
    private final BookingItemRepository bookingItemRepository;
    private final ExtraOrderRepository extraOrderRepository;

    /**
     * Hỗ trợ overloaded method: Nếu không truyền targetTime thì mặc định lấy thời gian hiện tại.
     */
    /**
     * Hàm chính: Cho phép truyền vào targetTime tùy chọn để xem trạng thái bàn theo khung giờ chỉ định.
     */
    @Transactional(readOnly = true)
    public BranchBoardResponse getBoard(Long branchId, Long zoneId, LocalDateTime targetTime) {
        branchRepository.findById(branchId)
                .orElseThrow(() -> new BusinessException(DiningTableErrorCode.BRANCH_NOT_FOUND));

        List<Zone> zones = resolveZones(branchId, zoneId);
        List<Long> zoneIds = zones.stream().map(Zone::getId).toList();

        List<DiningTable> tables = zoneIds.isEmpty()
                ? List.of()
                : diningTableRepository.findByZoneIdInOrderByZoneIdAscIdAsc(zoneIds);

        // Truyền targetTime vào quá trình build trạng thái bàn
        Map<Long, TableBoardResponse> responseByTableId = buildTableBoardResponseMap(tables, targetTime);

        Map<Long, List<DiningTable>> tablesByZoneId = tables.stream()
                .collect(Collectors.groupingBy(t -> t.getZone().getId(), LinkedHashMap::new, Collectors.toList()));

        List<ZoneBoardResponse> zoneResponses = new ArrayList<>();
        for (Zone zone : zones) {
            List<DiningTable> zoneTables = tablesByZoneId.getOrDefault(zone.getId(), List.of());

            ZoneBoardResponse zoneResponse = new ZoneBoardResponse();
            zoneResponse.setZoneId(zone.getId());
            zoneResponse.setZoneName(zone.getZoneName());
            zoneResponse.setDescription(zone.getDescription());
            zoneResponse.setTables(zoneTables.stream()
                    .map(table -> responseByTableId.get(table.getId()))
                    .toList());

            zoneResponses.add(zoneResponse);
        }

        BranchBoardResponse response = new BranchBoardResponse();
        response.setBranchId(branchId);
        response.setZones(zoneResponses);
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public List<TableBoardResponse> getTableBoards(List<Long> tableIds) {
        if (tableIds == null || tableIds.isEmpty()) {
            return List.of();
        }
        List<DiningTable> tables = diningTableRepository.findAllById(tableIds);
        // Mặc định real-time khi gọi qua WebSocket event
        return new ArrayList<>(buildTableBoardResponseMap(tables, null).values());
    }

    private List<Zone> resolveZones(Long branchId, Long zoneId) {
        if (zoneId == null) {
            return zoneRepository.findByBranchIdOrderByIdAsc(branchId);
        }
        Zone zone = zoneRepository.findById(zoneId)
                .orElseThrow(() -> new BusinessException(ZoneErrorCode.ZONE_NOT_FOUND));
        if (!zone.getBranch().getId().equals(branchId)) {
            throw new BusinessException(ZoneErrorCode.ZONE_NOT_FOUND);
        }
        return List.of(zone);
    }

    private Map<Long, TableBoardResponse> buildTableBoardResponseMap(List<DiningTable> tables, LocalDateTime targetTime) {
        if (tables.isEmpty()) {
            return Map.of();
        }

        Map<Long, Booking> activeBookingByTableId = loadActiveBookings(
                tables.stream().map(DiningTable::getId).toList(), targetTime);

        Set<Long> activeBookingIds = activeBookingByTableId.values().stream()
                .map(Booking::getId)
                .collect(Collectors.toCollection(HashSet::new));

        Map<Long, List<OrderItemResponse>> ordersByBookingId = new HashMap<>();
        Map<Long, BigDecimal> totalByBookingId = new HashMap<>();
        for (Long bookingId : activeBookingIds) {
            List<OrderItemResponse> orders = buildUnifiedOrders(bookingId);
            ordersByBookingId.put(bookingId, orders);
            totalByBookingId.put(bookingId, sumLineTotals(orders));
        }

        Map<Long, TableBoardResponse> result = new LinkedHashMap<>();
        for (DiningTable table : tables) {
            result.put(table.getId(), toTableBoardResponse(
                    table,
                    activeBookingByTableId.get(table.getId()),
                    ordersByBookingId,
                    totalByBookingId));
        }
        return result;
    }

    /**
     * Đã cập nhật sử dụng targetTime (nếu null sẽ tự động fallback về LocalDateTime.now())
     */
    /**
     * Tách biệt logic tìm booking active:
     * - Nếu xem theo slot (targetTime != null): Chỉ lấy booking có reservationTime khớp với targetTime (hoặc thuộc khoảng giờ của slot).
     * - Nếu xem realtime (targetTime == null): Lấy các bàn đang CHECKED_IN thực tế hoặc có lịch gần nhất.
     */
    private Map<Long, Booking> loadActiveBookings(List<Long> tableIds, LocalDateTime targetTime) {
        if (tableIds.isEmpty()) {
            return Map.of();
        }

        Map<Long, Booking> result = new HashMap<>();

        if (targetTime != null) {
            // ==========================================
            // CHẾ ĐỘ XEM THEO SLOT (LỊCH ĐẶT)
            // ==========================================
            // Chỉ tìm các đơn CONFIRMED có đúng reservationTime khớp với targetTime của slot.
            // Hoàn toàn bỏ qua các đơn CHECKED_IN hoặc các đơn giờ khác.
            List<BookingStatus> slotStatuses = List.of(BookingStatus.CONFIRMED);
            List<BookingTable> bookingTables =
                    bookingTableRepository.findByDiningTable_IdInAndBooking_StatusIn(tableIds, slotStatuses);

            for (BookingTable bt : bookingTables) {
                Long tableId = bt.getDiningTable().getId();
                Booking candidate = bt.getBooking();

                // Kiểm tra chính xác thời gian đặt lịch phải khớp với targetTime
                if (candidate.getReservationTime() != null && candidate.getReservationTime().equals(targetTime)) {
                    result.merge(tableId, candidate, this::pickPreferredBooking);
                }
            }
        } else {
            // ==========================================
            // CHẾ ĐỘ XEM REALTIME (HIỆN TẠI - MẶC ĐỊNH)
            // ==========================================
            // Lúc này mới cho phép lấy cả CHECKED_IN và CONFIRMED trong phạm vi lead time
            List<BookingTable> bookingTables =
                    bookingTableRepository.findByDiningTable_IdInAndBooking_StatusIn(tableIds, ACTIVE_BOOKING_STATUSES);

            LocalDateTime now = LocalDateTime.now();
            for (BookingTable bt : bookingTables) {
                Long tableId = bt.getDiningTable().getId();
                Booking candidate = bt.getBooking();

                boolean isCheckedIn = candidate.getStatus() == BookingStatus.CHECKED_IN;
                boolean isWithinLeadTime = candidate.getReservationTime() != null
                        && !candidate.getReservationTime().isAfter(now.plusMinutes(ACTIVE_BOOKING_LEAD_MINUTES));

                if (isCheckedIn || isWithinLeadTime) {
                    result.merge(tableId, candidate, this::pickPreferredBooking);
                }
            }
        }

        return result;
    }

    private Booking pickPreferredBooking(Booking a, Booking b) {
        if (a.getStatus() == BookingStatus.CHECKED_IN && b.getStatus() != BookingStatus.CHECKED_IN) return a;
        if (b.getStatus() == BookingStatus.CHECKED_IN && a.getStatus() != BookingStatus.CHECKED_IN) return b;
        return b.getReservationTime().isBefore(a.getReservationTime()) ? b : a;
    }

    private List<OrderItemResponse> buildUnifiedOrders(Long bookingId) {
        List<OrderItemResponse> orders = new ArrayList<>();

        for (BookingItem item : bookingItemRepository.findByBooking_IdOrderByCreatedAtAsc(bookingId)) {
            OrderItemResponse dto = new OrderItemResponse();
            dto.setId(item.getId());
            dto.setSource(OrderSource.PREORDER);
            dto.setMenuItemId(item.getMenuItem() != null ? item.getMenuItem().getId() : null);
            dto.setItemName(item.getSnapshotName());
            dto.setPrice(item.getSnapshotPrice());
            dto.setQuantity(item.getQuantity());
            dto.setLineTotal(item.getSnapshotPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
            dto.setWalkIn(Boolean.TRUE.equals(item.getIsWalkInOrder()));
            dto.setCreatedAt(item.getCreatedAt());
            orders.add(dto);
        }

        for (ExtraOrder extra : extraOrderRepository.findByBookingIdOrderByCreatedAtAsc(bookingId)) {
            OrderItemResponse dto = new OrderItemResponse();
            dto.setId(extra.getId());
            dto.setSource(OrderSource.EXTRA_ORDER);
            dto.setMenuItemId(extra.getMenuItem() != null ? extra.getMenuItem().getId() : null);
            dto.setItemName(extra.getItemNameAtTime());
            dto.setPrice(extra.getPriceAtTime());
            dto.setQuantity(extra.getQuantity());
            dto.setLineTotal(extra.getPriceAtTime().multiply(BigDecimal.valueOf(extra.getQuantity())));
            dto.setRecordedByName(extra.getRecordedBy() != null ? extra.getRecordedBy().getFullName() : null);
            dto.setCreatedAt(extra.getCreatedAt());
            orders.add(dto);
        }

        orders.sort(Comparator.comparing(OrderItemResponse::getCreatedAt));
        return orders;
    }

    private BigDecimal sumLineTotals(List<OrderItemResponse> orders) {
        return orders.stream()
                .map(OrderItemResponse::getLineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private TableBoardResponse toTableBoardResponse(
            DiningTable table,
            Booking activeBooking,
            Map<Long, List<OrderItemResponse>> ordersByBookingId,
            Map<Long, BigDecimal> totalByBookingId) {

        TableBoardResponse response = new TableBoardResponse();
        response.setTableId(table.getId());
        response.setTableName(table.getTableName());
        response.setCapacity(table.getCapacity());

        if (activeBooking != null) {
            response.setActiveBooking(toActiveBookingResponse(activeBooking));
            response.setOrders(ordersByBookingId.getOrDefault(activeBooking.getId(), List.of()));
            response.setEstimatedTotal(totalByBookingId.getOrDefault(activeBooking.getId(), BigDecimal.ZERO));

            // PHÂN ĐỊNH TRẠNG THÁI BÀN DỰA TRÊN BOOKING THAY VÌ LẤY TRẠNG THÁI GỐC CỦA BÀN:
            // - Nếu đơn đang CHECKED_IN (khách đang ngồi ăn thực tế): Trạng thái bàn là Đang dùng (Mã 3)
            // - Nếu đơn là CONFIRMED (đặt lịch trước cho slot giờ đó): Trạng thái bàn là Đã đặt (Mã 2)
            if (activeBooking.getStatus() == BookingStatus.CHECKED_IN) {
                response.setStatus(3); // Giả định 3 là mã trạng thái "Đang dùng" (Occupied)
            } else {
                response.setStatus(2); // Giả định 2 là mã trạng thái "Đã đặt" (Reserved)
            }
        } else {
            // Không có lịch/khách vào khung giờ này -> Bàn Trống (Mã 1)
            response.setStatus(1); // Giả định 1 là mã trạng thái "Trống" (Empty)
        }

        return response;
    }

    private ActiveBookingResponse toActiveBookingResponse(Booking booking) {
        ActiveBookingResponse dto = new ActiveBookingResponse();
        dto.setBookingId(booking.getId());
        dto.setStatus(booking.getStatus());
        dto.setContactName(booking.getContactName());
        dto.setContactPhone(booking.getContactPhone());
        dto.setReservationTime(booking.getReservationTime());
        dto.setGuestCount(booking.getGuestCount() == null ? null : booking.getGuestCount().intValue());
        return dto;
    }
}