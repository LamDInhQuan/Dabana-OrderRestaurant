package com.dabana.backend.modules.booking.mapper;

import com.dabana.backend.modules.auth.entity.User;
import com.dabana.backend.modules.booking.Booking;
import com.dabana.backend.modules.booking.BookingItem;
import com.dabana.backend.modules.booking.dto.BookingDtos;
import com.dabana.backend.modules.branch2.entity.Branch;
import com.dabana.backend.modules.diningtable.mapper.DiningTableMapper;
import com.dabana.backend.modules.admin.service.ISystemPolicyService;
import com.dabana.backend.modules.booking.BookingStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@RequiredArgsConstructor
@Component
public class BookingMapper {

    private final BookingItemMapper bookingItemMapper;
    private final DiningTableMapper diningTableMapper;
    private final ISystemPolicyService systemPolicyService;

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
        LocalDateTime confirmedAt = systemPolicyService.getEffectiveConfirmedAt(booking);
        boolean inGracePeriod = booking.getStatus() == BookingStatus.CONFIRMED && systemPolicyService.isWithinCancellationGracePeriod(booking);
        Long graceRemainingSeconds = inGracePeriod ? systemPolicyService.getRemainingGracePeriodSeconds(booking) : 0L;
        Integer graceMinutes = systemPolicyService.getGracePeriodMinutes();

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
                .refundAmount(booking.getRefundAmount())
                .penaltyAmount(booking.getPenaltyAmount())
                .refundStatus(booking.getRefundStatus() != null ? booking.getRefundStatus().name() : null)
                .cancelledAt(booking.getCancelledAt())
                .cancelReason(booking.getCancelReason())
                .confirmedAt(confirmedAt)
                .inGracePeriod(inGracePeriod)
                .gracePeriodRemainingSeconds(graceRemainingSeconds)
                .gracePeriodMinutes(graceMinutes)
                .build();
    }
}