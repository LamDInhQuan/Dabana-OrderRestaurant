package com.dabana.backend.modules.booking.repository;

import com.dabana.backend.modules.booking.BookingItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookingItemRepository extends JpaRepository<BookingItem, Long> {

}