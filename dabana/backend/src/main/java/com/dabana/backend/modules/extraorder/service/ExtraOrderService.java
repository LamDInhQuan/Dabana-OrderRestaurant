package com.dabana.backend.modules.extraorder.service;

import com.dabana.backend.exception.BusinessException;
import com.dabana.backend.modules.auth.entity.User;
import com.dabana.backend.modules.booking.Booking;
import com.dabana.backend.modules.booking.BookingErrorCode;
import com.dabana.backend.modules.booking.BookingRepository;
import com.dabana.backend.modules.booking.BookingStatus;
import com.dabana.backend.modules.extraorder.dto.request.AddExtraOrderRequest;
import com.dabana.backend.modules.extraorder.dto.request.UpdateExtraOrderQuantityRequest;
import com.dabana.backend.modules.extraorder.dto.response.ExtraOrderResponse;
import com.dabana.backend.modules.extraorder.entity.ExtraOrder;
import com.dabana.backend.modules.extraorder.mapper.ExtraOrderMapper;
import com.dabana.backend.modules.extraorder.repository.ExtraOrderRepository;
import com.dabana.backend.modules.extraorder.util.ExtraOrderErrorCode;
import com.dabana.backend.modules.menu.entity.MenuItem;
import com.dabana.backend.modules.menu.repository.MenuItemRepository;
import com.dabana.backend.modules.menu.util.MenuItemStatus;
import com.dabana.backend.modules.orderboard.event.TableBoardChangedEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Trien khai task 3 cua Tab Goi mon: quan ly rs_extra_orders (mon goi them
 * trong luc khach dang dung bua), tach biet voi rs_preorder_items nhung
 * duoc gop lai o tang service/API rieng (task 4 - Unified Order).
 */
@Service
@RequiredArgsConstructor
public class ExtraOrderService implements IExtraOrderService {

    private final ExtraOrderRepository extraOrderRepository;
    private final BookingRepository bookingRepository;
    private final MenuItemRepository menuItemRepository;
    private final ExtraOrderMapper extraOrderMapper;
    // Task 5: publish event de OrderBoardWebSocketListener (module orderboard) broadcast
    // qua STOMP khi mon goi them thay doi (khong doi trang thai ban, chi doi don hang/tong tien).
    private final ApplicationEventPublisher eventPublisher;

    @Override
    public List<ExtraOrderResponse> getByBooking(Long bookingId) {
        return extraOrderRepository.findByBookingIdOrderByCreatedAtAsc(bookingId).stream()
                .map(extraOrderMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public ExtraOrderResponse addItem(AddExtraOrderRequest request, User currentUser) {
        if (currentUser == null) {
            throw new BusinessException(ExtraOrderErrorCode.RECORDED_BY_USER_REQUIRED);
        }

        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new BusinessException(BookingErrorCode.BOOKING_NOT_FOUND));

        // Chi ghi nhan mon goi them khi khach dang thuc su dung ban (da check-in),
        // tranh nham lan voi rs_preorder_items (mon dat truoc luc dat ban).
        if (booking.getStatus() != BookingStatus.CHECKED_IN) {
            throw new BusinessException(ExtraOrderErrorCode.BOOKING_NOT_CHECKED_IN);
        }

        MenuItem menuItem = menuItemRepository.findById(request.getMenuItemId())
                .orElseThrow(() -> new BusinessException(ExtraOrderErrorCode.EXTRA_ORDER_ITEM_NOT_FOUND));
        if (!MenuItemStatus.SELLING.equals(menuItem.getStatus())) {
            throw new BusinessException(ExtraOrderErrorCode.EXTRA_ORDER_ITEM_NOT_AVAILABLE);
        }

        ExtraOrder extraOrder = new ExtraOrder();
        extraOrder.setBooking(booking);
        extraOrder.setMenuItem(menuItem);
        // Snapshot ten + gia dong theo thuc don HIEN HANH tai thoi diem ghi nhan
        // (khac voi preorder la chot gia luc dat ban).
        extraOrder.setItemNameAtTime(menuItem.getItemName());
        extraOrder.setPriceAtTime(menuItem.getPrice());
        extraOrder.setQuantity(request.getQuantity());
        extraOrder.setRecordedBy(currentUser);

        extraOrder = extraOrderRepository.save(extraOrder);
        publishTableBoardChanged(booking);
        return extraOrderMapper.toResponse(extraOrder);
    }

    @Override
    @Transactional
    public ExtraOrderResponse updateQuantity(Long extraOrderId, UpdateExtraOrderQuantityRequest request, User currentUser) {
        if (currentUser == null) {
            throw new BusinessException(ExtraOrderErrorCode.RECORDED_BY_USER_REQUIRED);
        }

        ExtraOrder extraOrder = extraOrderRepository.findById(extraOrderId)
                .orElseThrow(() -> new BusinessException(ExtraOrderErrorCode.EXTRA_ORDER_NOT_FOUND));

        // Chi cho sua so luong khi booking van dang CHECKED_IN, tranh lech so lieu
        // hoa don (rs_invoices) sau khi da checkout/huy/no-show.
        if (extraOrder.getBooking().getStatus() != BookingStatus.CHECKED_IN) {
            throw new BusinessException(ExtraOrderErrorCode.BOOKING_NOT_CHECKED_IN);
        }

        extraOrder.setQuantity(request.getQuantity());
        // Ghi nhan lai nguoi thuc hien gan nhat (BR muc 2 - Tab Goi mon) khi sua so luong.
        extraOrder.setRecordedBy(currentUser);

        extraOrder = extraOrderRepository.save(extraOrder);
        publishTableBoardChanged(extraOrder.getBooking());
        return extraOrderMapper.toResponse(extraOrder);
    }

    @Override
    @Transactional
    public void deleteItem(Long extraOrderId) {
        ExtraOrder extraOrder = extraOrderRepository.findById(extraOrderId)
                .orElseThrow(() -> new BusinessException(ExtraOrderErrorCode.EXTRA_ORDER_NOT_FOUND));

        // Chi cho xoa dong goi them khi booking van dang CHECKED_IN, tranh lech so lieu
        // hoa don (rs_invoices) sau khi da checkout/huy/no-show.
        if (extraOrder.getBooking().getStatus() != BookingStatus.CHECKED_IN) {
            throw new BusinessException(ExtraOrderErrorCode.BOOKING_NOT_CHECKED_IN);
        }

        Booking booking = extraOrder.getBooking();
        extraOrderRepository.delete(extraOrder);
        publishTableBoardChanged(booking);
    }

    /**
     * Task 5: bao Tab Goi Mon realtime rang don hang cua (cac) ban gan voi booking
     * nay vua thay doi (them/sua/xoa mon goi them). Trang thai ban KHONG doi trong
     * cac thao tac nay, nhung tong tien tam tinh + danh sach mon (Unified Order) thi
     * co - listener se broadcast lai toan bo TableBoardResponse SAU KHI commit.
     */
    private void publishTableBoardChanged(Booking booking) {
        List<Long> tableIds = booking.getBookingTables().stream()
                .map(bt -> bt.getDiningTable().getId())
                .toList();
        eventPublisher.publishEvent(new TableBoardChangedEvent(booking.getBranch().getId(), tableIds));
    }
}