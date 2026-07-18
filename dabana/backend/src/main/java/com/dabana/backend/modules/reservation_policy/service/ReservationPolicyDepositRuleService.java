package com.dabana.backend.modules.reservation_policy.service;

import com.dabana.backend.exception.BusinessException;
import com.dabana.backend.modules.reservation_policy.dto.request.CreateReservationPolicyDepositRuleRequest;
import com.dabana.backend.modules.reservation_policy.dto.request.UpdateReservationPolicyDepositRuleRequest;
import com.dabana.backend.modules.reservation_policy.dto.response.ReservationPolicyDepositRuleResponse;
import com.dabana.backend.modules.reservation_policy.entity.ReservationPolicy;
import com.dabana.backend.modules.reservation_policy.entity.ReservationPolicyDepositRule;
import com.dabana.backend.modules.reservation_policy.mapper.ReservationPolicyDepositRuleMapper;
import com.dabana.backend.modules.reservation_policy.repository.ReservationPolicyDepositRuleRepository;
import com.dabana.backend.modules.reservation_policy.repository.ReservationPolicyRepository;
import com.dabana.backend.modules.reservation_policy.util.DepositType;
import com.dabana.backend.modules.reservation_policy.util.PolicyErrorCode;
import com.dabana.backend.modules.restaurant.RestaurantErrorCode;
import com.dabana.backend.modules.restaurant.repository.RestaurantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ReservationPolicyDepositRuleService implements IReservationPolicyDepositRuleService {

    private final RestaurantRepository restaurantRepository;
    private final ReservationPolicyRepository reservationPolicyRepository;
    private final ReservationPolicyDepositRuleRepository reservationPolicyDepositRuleRepository;
    private final ReservationPolicyDepositRuleMapper reservationPolicyDepositRuleMapper;

    @Override
    @Transactional
    public ReservationPolicyDepositRuleResponse create(Long restaurantId, Long policyId, CreateReservationPolicyDepositRuleRequest request) {
        restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new BusinessException(RestaurantErrorCode.RESTAURANT_NOT_FOUND));

        ReservationPolicy policy = reservationPolicyRepository.findByIdAndRestaurantId(policyId, restaurantId)
                .orElseThrow(() -> new BusinessException(PolicyErrorCode.POLICY_NOT_FOUND));

        validateRule(request);
        assertNoGuestRangeOverlap(policyId, request.getMinGuests(), request.getMaxGuests(), null);

        ReservationPolicyDepositRule entity = reservationPolicyDepositRuleMapper.toEntity(request, policy);
        return reservationPolicyDepositRuleMapper.toResponse(reservationPolicyDepositRuleRepository.save(entity));
    }

    @Override
    @Transactional
    public ReservationPolicyDepositRuleResponse update(Long restaurantId, Long policyId, Long ruleId, UpdateReservationPolicyDepositRuleRequest request) {
        restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new BusinessException(RestaurantErrorCode.RESTAURANT_NOT_FOUND));

        reservationPolicyRepository.findByIdAndRestaurantId(policyId, restaurantId)
                .orElseThrow(() -> new BusinessException(PolicyErrorCode.POLICY_NOT_FOUND));

        ReservationPolicyDepositRule entity = reservationPolicyDepositRuleRepository.findByIdAndPolicyId(ruleId, policyId)
                .orElseThrow(() -> new BusinessException(PolicyErrorCode.DEPOSIT_RULE_NOT_FOUND));

        validateRule(request);
        assertNoGuestRangeOverlap(policyId, request.getMinGuests(), request.getMaxGuests(), ruleId);

        entity.setMinGuest(request.getMinGuests());
        entity.setMaxGuest(request.getMaxGuests());
        entity.setDepositType(request.getDepositType());
        entity.setDepositValue(request.getDepositValue());

        return reservationPolicyDepositRuleMapper.toResponse(reservationPolicyDepositRuleRepository.save(entity));
    }

    @Override
    @Transactional
    public void delete(Long restaurantId, Long policyId, Long ruleId) {
        restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new BusinessException(RestaurantErrorCode.RESTAURANT_NOT_FOUND));

        reservationPolicyRepository.findByIdAndRestaurantId(policyId, restaurantId)
                .orElseThrow(() -> new BusinessException(PolicyErrorCode.POLICY_NOT_FOUND));

        ReservationPolicyDepositRule entity = reservationPolicyDepositRuleRepository.findByIdAndPolicyId(ruleId, policyId)
                .orElseThrow(() -> new BusinessException(PolicyErrorCode.DEPOSIT_RULE_NOT_FOUND));

        reservationPolicyDepositRuleRepository.delete(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public ReservationPolicyDepositRuleResponse getDetail(Long restaurantId, Long policyId, Long ruleId) {
        restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new BusinessException(RestaurantErrorCode.RESTAURANT_NOT_FOUND));

        reservationPolicyRepository.findByIdAndRestaurantId(policyId, restaurantId)
                .orElseThrow(() -> new BusinessException(PolicyErrorCode.POLICY_NOT_FOUND));

        ReservationPolicyDepositRule entity = reservationPolicyDepositRuleRepository.findByIdAndPolicyId(ruleId, policyId)
                .orElseThrow(() -> new BusinessException(PolicyErrorCode.DEPOSIT_RULE_NOT_FOUND));

        return reservationPolicyDepositRuleMapper.toResponse(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReservationPolicyDepositRuleResponse> getAll(Long restaurantId, Long policyId) {
        restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new BusinessException(RestaurantErrorCode.RESTAURANT_NOT_FOUND));

        reservationPolicyRepository.findByIdAndRestaurantId(policyId, restaurantId)
                .orElseThrow(() -> new BusinessException(PolicyErrorCode.POLICY_NOT_FOUND));

        return reservationPolicyDepositRuleRepository.findAllByPolicyIdOrderByMinGuestAsc(policyId)
                .stream()
                .map(reservationPolicyDepositRuleMapper::toResponse)
                .toList();
    }

    private void validateRule(CreateReservationPolicyDepositRuleRequest request) {
        validateRule(request.getMinGuests(), request.getMaxGuests(), request.getDepositType(), request.getDepositValue());
    }

    private void validateRule(UpdateReservationPolicyDepositRuleRequest request) {
        validateRule(request.getMinGuests(), request.getMaxGuests(), request.getDepositType(), request.getDepositValue());
    }

    private void validateRule(
            Integer minGuest,
            Integer maxGuest,
            DepositType depositType,
            BigDecimal depositValue) {

        if (minGuest == null || maxGuest == null) {
            throw new BusinessException(PolicyErrorCode.INVALID_DEPOSIT_RULE);
        }

        if (minGuest < 1) {
            throw new BusinessException(PolicyErrorCode.INVALID_DEPOSIT_RULE);
        }

        if (minGuest > maxGuest) {
            throw new BusinessException(PolicyErrorCode.INVALID_DEPOSIT_RULE);
        }

        if (depositType == null) {
            throw new BusinessException(PolicyErrorCode.INVALID_DEPOSIT_RULE);
        }

        switch (depositType) {
            case NO_DEPOSIT -> {
                if (depositValue != null &&
                        depositValue.compareTo(BigDecimal.ZERO) != 0) {
                    throw new BusinessException(PolicyErrorCode.INVALID_DEPOSIT_RULE);
                }
            }
            case FIXED, PER_PERSON -> {
                if (depositValue == null ||
                        depositValue.compareTo(BigDecimal.ZERO) <= 0) {
                    throw new BusinessException(PolicyErrorCode.INVALID_DEPOSIT_RULE);
                }
            }
        }
    }

    private void assertNoGuestRangeOverlap(Long policyId, Integer minGuest, Integer maxGuest, Long excludeId) {
        List<ReservationPolicyDepositRule> existingRules = reservationPolicyDepositRuleRepository.findAllByPolicyIdOrderByMinGuestAsc(policyId);

        for (ReservationPolicyDepositRule existing : existingRules) {
            if (excludeId != null && existing.getId().equals(excludeId)) {
                continue;
            }
            if (minGuest <= existing.getMaxGuest() && existing.getMinGuest() <= maxGuest) {
                throw new BusinessException(PolicyErrorCode.INVALID_DEPOSIT_RULE);
            }
        }
    }
}
