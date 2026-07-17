package com.dabana.backend.modules.reservation_policy.service;

import com.dabana.backend.exception.BusinessException;
import com.dabana.backend.modules.reservation_policy.dto.request.CreateReservationPolicyRequest;
import com.dabana.backend.modules.reservation_policy.dto.request.UpdateReservationPolicyRequest;
import com.dabana.backend.modules.reservation_policy.dto.response.ReservationPolicyDetailResponse;
import com.dabana.backend.modules.reservation_policy.dto.response.ReservationPolicyResponse;
import com.dabana.backend.modules.reservation_policy.entity.ReservationPolicy;
import com.dabana.backend.modules.reservation_policy.mapper.ReservationPolicyMapper;
import com.dabana.backend.modules.reservation_policy.repository.ReservationPolicyRepository;
import com.dabana.backend.modules.reservation_policy.util.PolicyErrorCode;
import com.dabana.backend.modules.restaurant.Restaurant;
import com.dabana.backend.modules.restaurant.RestaurantErrorCode;
import com.dabana.backend.modules.restaurant.RestaurantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ReservationPolicyService implements IReservationPolicyService {

    private final ReservationPolicyRepository reservationPolicyRepository;
    private final RestaurantRepository restaurantRepository;
    private final ReservationPolicyMapper reservationPolicyMapper;

    @Override
    @Transactional
    public ReservationPolicyResponse create(Long restaurantId, CreateReservationPolicyRequest request) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new BusinessException(RestaurantErrorCode.RESTAURANT_NOT_FOUND));

        boolean existed = reservationPolicyRepository.existsByRestaurantIdAndPolicyCode(restaurantId, request.getPolicyCode().trim());
        if (existed) {
            throw new BusinessException(PolicyErrorCode.POLICY_ALREADY_EXISTS);
        }

        ReservationPolicy reservationPolicy = reservationPolicyMapper.toEntity(request, restaurant);
        ReservationPolicy saved = reservationPolicyRepository.save(reservationPolicy);
        return reservationPolicyMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public ReservationPolicyResponse update(Long restaurantId, Long policyId, UpdateReservationPolicyRequest request) {
        ReservationPolicy reservationPolicy = reservationPolicyRepository.findByIdAndRestaurantId(policyId, restaurantId)
                .orElseThrow(() -> new BusinessException(PolicyErrorCode.POLICY_NOT_FOUND));

        boolean duplicatedCode = reservationPolicyRepository.existsByRestaurantIdAndPolicyCodeAndIdNot(
                restaurantId,
                reservationPolicy.getPolicyCode(),
                policyId
        );
        if (duplicatedCode) {
            throw new BusinessException(PolicyErrorCode.POLICY_ALREADY_EXISTS);
        }

        reservationPolicy.setName(request.getName().trim());
        reservationPolicy.setDescription(request.getDescription());
        reservationPolicy.setTermsAndConditions(request.getTermsAndConditions());
        reservationPolicy.setStatus(request.getStatus());

        return reservationPolicyMapper.toResponse(reservationPolicyRepository.save(reservationPolicy));
    }

    @Override
    @Transactional(readOnly = true)
    public ReservationPolicyDetailResponse getDetail(Long restaurantId, Long policyId) {
        ReservationPolicy reservationPolicy = reservationPolicyRepository.findDetailByIdAndRestaurantId(policyId, restaurantId)
                .orElseThrow(() -> new BusinessException(PolicyErrorCode.POLICY_NOT_FOUND));

        return reservationPolicyMapper.toDetailResponse(reservationPolicy);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReservationPolicyResponse> getAll(Long restaurantId) {
        return reservationPolicyRepository.findAllByRestaurantId(restaurantId)
                .stream()
                .map(reservationPolicyMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public void delete(Long restaurantId, Long policyId) {
        ReservationPolicy reservationPolicy = reservationPolicyRepository.findByIdAndRestaurantId(policyId, restaurantId)
                .orElseThrow(() -> new BusinessException(PolicyErrorCode.POLICY_NOT_FOUND));

        reservationPolicyRepository.delete(reservationPolicy);
    }
}