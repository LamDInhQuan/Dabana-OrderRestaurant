package com.dabana.backend.modules.invoice.repository;

import com.dabana.backend.modules.invoice.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    Optional<Invoice> findByBooking_Id(Long bookingId);

    boolean existsByBooking_Id(Long bookingId);
}
