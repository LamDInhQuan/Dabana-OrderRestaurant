package com.dabana.backend.modules.reservation_policy.service;

import com.dabana.backend.modules.reservation_policy.dto.request.CreateReservationPolicyScheduleRequest;
import com.dabana.backend.modules.reservation_policy.dto.response.ReservationPolicyScheduleResponse;

import java.util.List;

public interface IReservationPolicyScheduleService {

    ReservationPolicyScheduleResponse create(
            Long restaurantId,
            Long policyId,
            CreateReservationPolicyScheduleRequest request
    );

    ReservationPolicyScheduleResponse update(
            Long restaurantId,
            Long policyId,
            Long scheduleId,
            CreateReservationPolicyScheduleRequest request
    );

    void delete(Long restaurantId, Long policyId, Long scheduleId);

    ReservationPolicyScheduleResponse getDetail(Long restaurantId, Long policyId, Long scheduleId);

    List<ReservationPolicyScheduleResponse> getAll(Long restaurantId, Long policyId);
}
