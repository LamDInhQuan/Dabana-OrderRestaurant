package com.dabana.backend.modules.booking.mapper;

import com.dabana.backend.modules.auth.entity.User;
import com.dabana.backend.modules.booking.Booking;
import com.dabana.backend.modules.booking.dto.BookingDtos;
import com.dabana.backend.modules.branch2.entity.Branch;
import org.springframework.stereotype.Component;

@Component
public class BookingMapper {

    public Booking toEntity(
            BookingDtos.CreateHoldRequest request,
            User customer,
            Branch branch
    ) {
        Booking booking = new Booking();
        booking.setBranch(branch);
        booking.setCustomer(customer);
        booking.setReservationTime(request.getReservationTime());
        booking.setGuestCount(request.getGuestCount().byteValue());
        return booking;
    }

    public BookingDtos.BookingResponse toResponse(Booking booking) {
        return BookingDtos.BookingResponse.builder()
                .id(booking.getId())
                .branchName(booking.getBranch().getName())
                .guestCount((int) booking.getGuestCount())
                .reservationTime(booking.getReservationTime())
                .holdExpiresAt(booking.getHoldExpiresAt())
                .status(booking.getStatus().name())
                .depositAmount(booking.getSnapshotDepositAmount())
                .build();
    }
}