package com.dabana.backend.modules.extraorder.repository;

import com.dabana.backend.modules.extraorder.entity.ExtraOrder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExtraOrderRepository extends JpaRepository<ExtraOrder, Long> {

    /** Liet ke mon goi them cua 1 booking theo thu tu ghi nhan, dung cho man hinh chi tiet ban va gop Unified Order (task 4). */
    List<ExtraOrder> findByBookingIdOrderByCreatedAtAsc(Long bookingId);

    /** Tim dong da co cua cung mon trong cung booking (con dang CHECKED_IN) de gop so luong thay vi tao dong trung lap. */
    java.util.Optional<ExtraOrder> findByBooking_IdAndMenuItem_Id(Long bookingId, Long menuItemId);
}