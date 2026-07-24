package com.dabana.backend.modules.booking.mapper;

import com.dabana.backend.modules.auth.entity.User;
import com.dabana.backend.modules.booking.Booking;
import com.dabana.backend.modules.booking.BookingItem;
import com.dabana.backend.modules.booking.dto.BookingDtos;
import com.dabana.backend.modules.branch2.entity.Branch;
import com.dabana.backend.modules.diningtable.mapper.DiningTableMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@RequiredArgsConstructor
@Component
public class BookingMapper {

    private final BookingItemMapper bookingItemMapper ;
    private final DiningTableMapper diningTableMapper;

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
                .restaurantName(booking.getBranch().getRestaurant().getRestaurantName())
                .branchName(booking.getBranch().getName())
                .status(booking.getStatus())
                .guestCount(booking.getGuestCount())
                .reservationTime(booking.getReservationTime())
                .tables(booking.getBookingTables()
                                .stream()
                                .map(table ->
                                        diningTableMapper.toResponse(table.getDiningTable())
                                )
                                .toList())
                .name(booking.getContactName())
                .phone(booking.getContactPhone())
                .note(booking.getNote())
                .items(booking.getItems()
                                .stream()
                                .map(bookingItemMapper::toResponse
                                )
                                .toList())
                .totalPreOrderAmount(booking.getEstimatedTotal())
                .holdExpiresAt(booking.getHoldExpiresAt())
                .estimatedTotal(booking.getEstimatedTotal())
                .policySnapshotDto(booking.getPolicySnapshot())
                .createdAt(booking.getCreatedAt())
                .build();
    }
}