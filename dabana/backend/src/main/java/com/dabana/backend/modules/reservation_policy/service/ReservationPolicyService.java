package com.dabana.backend.modules.reservation_policy.service;

import com.dabana.backend.modules.reservation_policy.dto.request.CreateReservationPolicyRequest;
import com.dabana.backend.modules.reservation_policy.dto.request.UpdateReservationPolicyRequest;
import com.dabana.backend.modules.reservation_policy.dto.response.ReservationPolicyResponse;
import com.dabana.backend.modules.reservation_policy.repository.ReservationPolicyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ReservationPolicyService implements IReservationPolicyService {

    private final ReservationPolicyRepository reservationPolicyRepository;


    @Override
    public ReservationPolicyResponse create(Long restaurantId, CreateReservationPolicyRequest request) {
        return null;
    }

    @Override
    public ReservationPolicyResponse update(Long restaurantId, Long policyId, UpdateReservationPolicyRequest request) {
        return null;
    }

    @Override
    @Transactional(readOnly = true)
    public ReservationPolicyResponse getDetail(Long restaurantId, Long policyId) {
        return null;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReservationPolicyResponse> getAll(Long restaurantId) {
        return List.of();
    }

    @Override
    public void delete(Long restaurantId, Long policyId) {

    }
}