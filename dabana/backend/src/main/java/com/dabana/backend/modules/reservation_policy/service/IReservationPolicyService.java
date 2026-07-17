package com.dabana.backend.modules.reservation_policy.service;

import com.dabana.backend.modules.reservation_policy.dto.request.CreateReservationPolicyRequest;
import com.dabana.backend.modules.reservation_policy.dto.request.UpdateReservationPolicyRequest;
import com.dabana.backend.modules.reservation_policy.dto.response.ReservationPolicyDetailResponse;
import com.dabana.backend.modules.reservation_policy.dto.response.ReservationPolicyResponse;

import java.util.List;

public interface IReservationPolicyService {
    ReservationPolicyResponse create(
            Long restaurantId,
            CreateReservationPolicyRequest request
    );

    ReservationPolicyResponse update(
            Long restaurantId,
            Long policyId,
            UpdateReservationPolicyRequest request
    );

    ReservationPolicyDetailResponse getDetail(
            Long restaurantId,
            Long policyId
    );

    List<ReservationPolicyResponse> getAll(
            Long restaurantId
    );

    void delete(
            Long restaurantId,
            Long policyId
    );

}
