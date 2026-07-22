package com.dabana.backend.modules.booking.service;

import com.dabana.backend.exception.BusinessException;
import com.dabana.backend.modules.booking.Booking;
import com.dabana.backend.modules.booking.BookingErrorCode;
import com.dabana.backend.modules.booking.BookingItem;
import com.dabana.backend.modules.booking.BookingStatus;
import com.dabana.backend.modules.booking.dto.BookingDtos;
import com.dabana.backend.modules.booking.dto.request.UpdateBookingItemQuantityRequest;
import com.dabana.backend.modules.booking.dto.response.PreorderItemResponse;
import com.dabana.backend.modules.booking.repository.BookingItemRepository;
import com.dabana.backend.modules.menu.entity.MenuItem;
import com.dabana.backend.modules.menu.repository.MenuItemRepository;
import com.dabana.backend.modules.menu.util.MenuItemStatus;
import com.dabana.backend.modules.orderboard.event.TableBoardChangedEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookingItemService implements IBookingItemService {

    private final BookingItemRepository bookingItemRepository;
    private final MenuItemRepository menuItemRepository;
    // Task 5 parity voi ExtraOrderService: bao Tab Goi Mon realtime khi mon dat truoc
    // duoc sua/xoa (trang thai ban khong doi, chi doi don hang/tong tien).
    private final ApplicationEventPublisher eventPublisher;

    @Override
    public void saveItems(Booking booking, List<BookingDtos.PreOrderItemRequest> requests) {

        if (requests == null || requests.isEmpty()) {
            return;
        }
        Set<Long> menuItemIds = requests.stream()
                .map(BookingDtos.PreOrderItemRequest::getMenuItemId)
                .collect(Collectors.toSet());
        List<MenuItem> menuItems = menuItemRepository.findAllById(menuItemIds);
        if (menuItems.size() != menuItemIds.size()) {
            throw new BusinessException(BookingErrorCode.PREORDER_ITEM_NOT_FOUND);
        }
        Map<Long, MenuItem> menuItemMap = menuItems.stream()
                .collect(Collectors.toMap(MenuItem::getId, menuItem -> menuItem));
        List<BookingItem> bookingItems = new ArrayList<>();
        for (BookingDtos.PreOrderItemRequest request : requests) {
            MenuItem menuItem = menuItemMap.get(request.getMenuItemId());
            if (!MenuItemStatus.SELLING.equals(menuItem.getStatus())) {
                throw new BusinessException(BookingErrorCode.PREORDER_ITEM_NOT_AVAILABLE);
            }
            BookingItem bookingItem = new BookingItem();
            bookingItem.setBooking(booking);
            bookingItem.setMenuItem(menuItem);

            // snapshot
            bookingItem.setSnapshotName(menuItem.getItemName());
            bookingItem.setSnapshotPrice(menuItem.getPrice());
            bookingItem.setQuantity(request.getQuantity());
            bookingItems.add(bookingItem);
        }
        bookingItemRepository.saveAll(bookingItems);
    }

    @Override
    public List<PreorderItemResponse> getByBooking(Long bookingId) {
        return bookingItemRepository.findByBooking_IdOrderByCreatedAtAsc(bookingId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public PreorderItemResponse updateQuantity(Long itemId, UpdateBookingItemQuantityRequest request) {
        BookingItem item = bookingItemRepository.findById(itemId)
                .orElseThrow(() -> new BusinessException(BookingErrorCode.PREORDER_ITEM_NOT_FOUND));

        // Chi cho sua so luong khi booking van dang CONFIRMED/CHECKED_IN, tranh lech
        // so lieu hoa don (rs_invoices) sau khi da checkout/huy/no-show. Dung chung
        // dieu kien "active" voi OrderBoardService (CONFIRMED/CHECKED_IN).
        assertBookingEditable(item.getBooking());

        item.setQuantity(request.getQuantity());
        item = bookingItemRepository.save(item);
        publishTableBoardChanged(item.getBooking());
        return toResponse(item);
    }

    @Override
    @Transactional
    public void deleteItem(Long itemId) {
        BookingItem item = bookingItemRepository.findById(itemId)
                .orElseThrow(() -> new BusinessException(BookingErrorCode.PREORDER_ITEM_NOT_FOUND));

        assertBookingEditable(item.getBooking());

        Booking booking = item.getBooking();
        bookingItemRepository.delete(item);
        publishTableBoardChanged(booking);
    }

    private void assertBookingEditable(Booking booking) {
        BookingStatus status = booking.getStatus();
        if (status != BookingStatus.CONFIRMED && status != BookingStatus.CHECKED_IN) {
            throw new BusinessException(BookingErrorCode.PREORDER_ITEM_NOT_EDITABLE);
        }
    }

    /**
     * Task 5 parity voi ExtraOrderService#publishTableBoardChanged: bao Tab Goi Mon
     * realtime rang don hang cua (cac) ban gan voi booking nay vua thay doi.
     */
    private void publishTableBoardChanged(Booking booking) {
        List<Long> tableIds = booking.getBookingTables().stream()
                .map(bt -> bt.getDiningTable().getId())
                .toList();
        eventPublisher.publishEvent(new TableBoardChangedEvent(booking.getBranch().getId(), tableIds));
    }

    private PreorderItemResponse toResponse(BookingItem item) {
        return PreorderItemResponse.builder()
                .id(item.getId())
                .bookingId(item.getBooking().getId())
                .menuItemId(item.getMenuItem() != null ? item.getMenuItem().getId() : null)
                .itemName(item.getSnapshotName())
                .price(item.getSnapshotPrice())
                .quantity(item.getQuantity())
                .lineTotal(item.getSnapshotPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .walkIn(Boolean.TRUE.equals(item.getIsWalkInOrder()))
                .createdAt(item.getCreatedAt())
                .build();
    }
}