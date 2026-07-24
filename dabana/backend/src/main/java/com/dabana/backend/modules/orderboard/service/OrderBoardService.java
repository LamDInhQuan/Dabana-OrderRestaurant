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
 *   (getTableBoards), dung boi OrderBoardWebSocketListener de broadcast
 *   qua STOMP moi khi co TableBoardChangedEvent.
 *
 * Gop du lieu tu Zone / DiningTable / Booking (+ BookingTable) / BookingItem
 * (rs_preorder_items) / ExtraOrder (rs_extra_orders) thanh 1 response duy
 * nhat. Service nay CHI DOC, khong ghi - viec doi trang thai ban/booking do
 * BookingService / DiningTableService / ExtraOrderService dam nhiem, va cac
 * service do se tu publish TableBoardChangedEvent sau khi ghi xong.
 */
@Service
@RequiredArgsConstructor
public class OrderBoardService implements IOrderBoardService {

    // Chi coi la "dang active" (hien thi thong tin khach + don hang tren the ban)
    // khi booking o CHECKED_IN (luon active, khach da ngoi) hoac CONFIRMED VA da
    // gan toi gio hen (trong vong ACTIVE_BOOKING_LEAD_MINUTES phut truoc
    // reservationTime). CONFIRMED con xa hon khong hien gi ca tren Tab Goi Mon -
    // KHONG canh bao, KHONG khoa nhan khach vang lai; day CHI la cua so hien thi,
    // khong con anh huong gi den viec nhan vien co duoc nhan khach vang lai hay
    // khong (FE tu quyet dinh dua tren trang thai vat ly cua ban).
    private static final List<BookingStatus> ACTIVE_BOOKING_STATUSES =
            List.of(BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN);
    private static final long ACTIVE_BOOKING_LEAD_MINUTES = 180;

    private final BranchRepository branchRepository;
    private final ZoneRepository zoneRepository;
    private final DiningTableRepository diningTableRepository;
    private final BookingTableRepository bookingTableRepository;
    private final BookingItemRepository bookingItemRepository;
    private final ExtraOrderRepository extraOrderRepository;

    @Override
    @Transactional(readOnly = true)
    public BranchBoardResponse getBoard(Long branchId, Long zoneId) {
        branchRepository.findById(branchId)
                .orElseThrow(() -> new BusinessException(DiningTableErrorCode.BRANCH_NOT_FOUND));

        List<Zone> zones = resolveZones(branchId, zoneId);
        List<Long> zoneIds = zones.stream().map(Zone::getId).toList();

        List<DiningTable> tables = zoneIds.isEmpty()
                ? List.of()
                : diningTableRepository.findByZoneIdInOrderByZoneIdAscIdAsc(zoneIds);

        Map<Long, TableBoardResponse> responseByTableId = buildTableBoardResponseMap(tables);

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
        return new ArrayList<>(buildTableBoardResponseMap(tables).values());
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

    /**
     * Logic dung chung cho ca getBoard (nhieu ban, nhom theo zone) va
     * getTableBoards (1 tap tableId le te khi co event thay doi). Tra ve
     * Map<tableId, TableBoardResponse> de goi noi dung linh hoat theo tung nhu cau.
     */
    private Map<Long, TableBoardResponse> buildTableBoardResponseMap(List<DiningTable> tables) {
        if (tables.isEmpty()) {
            return Map.of();
        }

        Map<Long, Booking> activeBookingByTableId = loadActiveBookings(
                tables.stream().map(DiningTable::getId).toList());

        // Build 1 lan don hang gop cho moi booking active duy nhat (tranh query lap
        // khi 1 booking gan nhieu ban cung luc - vd ban ghep).
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
     * Voi moi tableId, tim booking dang active gan voi no qua rs_reservation_tables:
     * CHECKED_IN (luon active) hoac CONFIRMED da trong vong ACTIVE_BOOKING_LEAD_MINUTES
     * phut truoc gio hen. CONFIRMED con xa hon bi bo qua hoan toan (khong hien gi).
     * Neu 1 ban lo co nhieu ung vien active cung luc (du ve nguyen tac khong nen
     * xay ra - vd vua nhan walk-in tren ban da co booking CONFIRMED sap toi), uu
     * tien CHECKED_IN (khach dang ngoi thuc te) truoc, sau do moi den booking co
     * reservationTime GAN NHAT.
     */
    private Map<Long, Booking> loadActiveBookings(List<Long> tableIds) {
        if (tableIds.isEmpty()) {
            return Map.of();
        }
        List<BookingTable> bookingTables =
                bookingTableRepository.findByDiningTable_IdInAndBooking_StatusIn(tableIds, ACTIVE_BOOKING_STATUSES);

        LocalDateTime activeThreshold = LocalDateTime.now().plusMinutes(ACTIVE_BOOKING_LEAD_MINUTES);

        Map<Long, Booking> result = new HashMap<>();
        for (BookingTable bt : bookingTables) {
            Long tableId = bt.getDiningTable().getId();
            Booking candidate = bt.getBooking();

            boolean isActive = candidate.getStatus() == BookingStatus.CHECKED_IN
                    || !candidate.getReservationTime().isAfter(activeThreshold);
            if (!isActive) continue;

            result.merge(tableId, candidate, this::pickPreferredBooking);
        }
        return result;
    }

    private Booking pickPreferredBooking(Booking a, Booking b) {
        if (a.getStatus() == BookingStatus.CHECKED_IN && b.getStatus() != BookingStatus.CHECKED_IN) return a;
        if (b.getStatus() == BookingStatus.CHECKED_IN && a.getStatus() != BookingStatus.CHECKED_IN) return b;
        return b.getReservationTime().isBefore(a.getReservationTime()) ? b : a;
    }

    /** Order Aggregation Rule (muc 2 tai lieu yeu cau): gop rs_preorder_items + rs_extra_orders thanh 1 danh sach. */
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
        response.setStatus(table.getStatus() == null ? null : table.getStatus().getCode());

        if (activeBooking != null) {
            response.setActiveBooking(toActiveBookingResponse(activeBooking));
            response.setOrders(ordersByBookingId.getOrDefault(activeBooking.getId(), List.of()));
            response.setEstimatedTotal(totalByBookingId.getOrDefault(activeBooking.getId(), BigDecimal.ZERO));
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