package com.dabana.backend.modules.admin.service;

import com.dabana.backend.modules.admin.dto.CancellationGracePeriodDto;
import com.dabana.backend.modules.admin.dto.RestaurantCancellationLeadTimePolicyDto;
import com.dabana.backend.modules.booking.Booking;

import java.time.LocalDateTime;

public interface ISystemPolicyService {

    CancellationGracePeriodDto getCancellationGracePeriodPolicy();

    CancellationGracePeriodDto updateCancellationGracePeriodPolicy(CancellationGracePeriodDto request);

    boolean isWithinCancellationGracePeriod(Booking booking);

    int getGracePeriodMinutes();

    boolean isGracePeriodEnabled();

    Long getRemainingGracePeriodSeconds(Booking booking);

    LocalDateTime getEffectiveConfirmedAt(Booking booking);

    RestaurantCancellationLeadTimePolicyDto getRestaurantCancellationLeadTimePolicy();

    RestaurantCancellationLeadTimePolicyDto updateRestaurantCancellationLeadTimePolicy(RestaurantCancellationLeadTimePolicyDto request);

    int getRestaurantCancelMinHoursBeforeReservation();

    boolean isRestaurantCancelPolicyEnabled();

    void validateRestaurantCancellationAllowed(Booking booking);
}

