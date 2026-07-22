package com.dabana.backend.modules.booking.repository;

import com.dabana.backend.modules.booking.BookingItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BookingItemRepository extends JpaRepository<BookingItem, Long> {

    /**
     * Dung boi OrderBoardService (Tab Goi Mon) de lay danh sach mon dat truoc
     * (rs_preorder_items) cua 1 booking, gop chung voi rs_extra_orders thanh
     * Unified Order theo dung Order Aggregation Rule.
     */
    List<BookingItem> findByBooking_IdOrderByCreatedAtAsc(Long bookingId);
}
