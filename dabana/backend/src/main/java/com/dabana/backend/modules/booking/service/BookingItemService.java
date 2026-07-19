package com.dabana.backend.modules.booking.service;

import com.dabana.backend.exception.BusinessException;
import com.dabana.backend.modules.booking.Booking;
import com.dabana.backend.modules.booking.BookingErrorCode;
import com.dabana.backend.modules.booking.BookingItem;
import com.dabana.backend.modules.booking.dto.BookingDtos;
import com.dabana.backend.modules.booking.repository.BookingItemRepository;
import com.dabana.backend.modules.menu.entity.MenuItem;
import com.dabana.backend.modules.menu.repository.MenuItemRepository;
import com.dabana.backend.modules.menu.util.MenuItemStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

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
}