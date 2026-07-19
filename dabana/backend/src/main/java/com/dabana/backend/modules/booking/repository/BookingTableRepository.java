package com.dabana.backend.modules.booking.repository;

import com.dabana.backend.modules.booking.BookingTable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BookingTableRepository extends JpaRepository<BookingTable, Long> {

}