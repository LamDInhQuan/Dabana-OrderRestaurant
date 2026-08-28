package com.dabana.backend.modules.booking.mapper;

import com.dabana.backend.modules.auth.entity.User;
import com.dabana.backend.modules.booking.Booking;
import com.dabana.backend.modules.booking.BookingItem;
import com.dabana.backend.modules.booking.dto.BookingDtos;
import com.dabana.backend.modules.branch2.entity.Branch;
import com.dabana.backend.modules.diningtable.mapper.DiningTableMapper;
import com.dabana.backend.modules.admin.service.ISystemPolicyService;
import com.dabana.backend.modules.booking.BookingStatus;
import com.dabana.backend.modules.booking.dto.PolicySnapshotDto;
import com.dabana.backend.modules.payment.entity.PayoutOrder;
import com.dabana.backend.modules.payment.repository.PayoutOrderRepository;
import com.dabana.backend.modules.payment.repository.RefundBankInfoRepository;
import com.dabana.backend.modules.payment.util.PayoutApprovalState;
import com.dabana.backend.modules.payment.util.PayoutState;
import com.dabana.backend.modules.reservation_policy.util.DepositType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@RequiredArgsConstructor
@Component
public class BookingMapper {

    private final BookingItemMapper bookingItemMapper;
    private final DiningTableMapper diningTableMapper;
    private final ISystemPolicyService systemPolicyService;
    private final RefundBankInfoRepository refundBankInfoRepository;
    private final PayoutOrderRepository payoutOrderRepository;

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

        BigDecimal depositAmount = booking.getEstimatedTotal();
        if (depositAmount == null || depositAmount.compareTo(BigDecimal.ZERO) == 0) {
            if (booking.getRefundAmount() != null || booking.getPenaltyAmount() != null) {
                depositAmount = (booking.getRefundAmount() != null ? booking.getRefundAmount() : BigDecimal.ZERO)
                        .add(booking.getPenaltyAmount() != null ? booking.getPenaltyAmount() : BigDecimal.ZERO);
            }
        }
        if ((depositAmount == null || depositAmount.compareTo(BigDecimal.ZERO) == 0) && booking.getPolicySnapshot() != null) {
            PolicySnapshotDto snap = booking.getPolicySnapshot();
            if (snap.getDepositValue() != null) {
                if (snap.getDepositType() == DepositType.PER_PERSON && booking.getGuestCount() != null) {
                    depositAmount = snap.getDepositValue().multiply(BigDecimal.valueOf(booking.getGuestCount()));
                } else {
                    depositAmount = snap.getDepositValue();
                }
            }
        }

        BigDecimal totalPreOrder = booking.getItems() != null ? booking.getItems().stream()
                .map(i -> (i.getSnapshotPrice() != null ? i.getSnapshotPrice() : BigDecimal.ZERO)
                        .multiply(BigDecimal.valueOf(i.getQuantity() != null ? i.getQuantity() : 1)))
                .reduce(BigDecimal.ZERO, BigDecimal::add) : BigDecimal.ZERO;

        boolean hasRefundBankInfo = false;
        String refundStatusStr = booking.getRefundStatus() != null ? booking.getRefundStatus().name() : null;
        if (booking.getId() != null) {
            hasRefundBankInfo = refundBankInfoRepository.existsByReservation_Id(booking.getId());
            var payoutOpt = payoutOrderRepository.findByReservation_Id(booking.getId());
            if (payoutOpt.isPresent()) {
                var payout = payoutOpt.get();
                if (payout.getState() == PayoutState.SUCCEEDED 
                        || payout.getApprovalState() == PayoutApprovalState.SUCCEEDED
                        || (payout.getPayosPayoutId() != null && !payout.getPayosPayoutId().isBlank() && payout.getState() != PayoutState.FAILED && payout.getState() != PayoutState.CANCELLED)) {
                    refundStatusStr = com.dabana.backend.modules.booking.util.RefundStatus.SUCCESS.name();
                } else if (payout.getState() == PayoutState.FAILED || payout.getState() == PayoutState.CANCELLED) {
                    refundStatusStr = com.dabana.backend.modules.booking.util.RefundStatus.FAILED.name();
                }
            }
        }

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
                .totalPreOrderAmount(totalPreOrder)
                .holdExpiresAt(booking.getHoldExpiresAt())
                .estimatedTotal(booking.getEstimatedTotal())
                .depositAmount(depositAmount)
                .policySnapshotDto(booking.getPolicySnapshot())
                .createdAt(booking.getCreatedAt())
                .refundAmount(booking.getRefundAmount())
                .penaltyAmount(booking.getPenaltyAmount())
                .refundStatus(refundStatusStr)
                .hasRefundBankInfo(hasRefundBankInfo)
                .cancelledAt(booking.getCancelledAt())
                .cancelReason(booking.getCancelReason())
                .confirmedAt(confirmedAt)
                .inGracePeriod(inGracePeriod)
                .gracePeriodRemainingSeconds(graceRemainingSeconds)
                .gracePeriodMinutes(graceMinutes)
                .build();
    }
}