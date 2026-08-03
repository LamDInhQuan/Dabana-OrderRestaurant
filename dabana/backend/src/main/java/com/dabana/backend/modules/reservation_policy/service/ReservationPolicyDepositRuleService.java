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

        validateRule(policyId, request, null);

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

        validateRule(policyId, request, ruleId);

        entity.setMinGuest(request.getMinGuests());
        entity.setMaxGuest(request.getMaxGuests());
        entity.setDepositType(request.getDepositType());
        entity.setDepositValue(request.getDepositValue());
        entity.setMaxTables(request.getMaxTables());
        entity.setMaxCapacitySlop(request.getMaxCapacitySlop() != null ? request.getMaxCapacitySlop() : 2);
        entity.setMinPreorderAmount(request.getMinPreorderAmount());
        entity.setPreorderDepositPercent(request.getPreorderDepositPercent());

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

    private void validateRule(Long policyId, CreateReservationPolicyDepositRuleRequest request, Long ruleId) {
        validateGuestRangeOverlap(policyId, request.getMinGuests(), request.getMaxGuests(), ruleId);
    }

    private void validateRule(Long policyId, UpdateReservationPolicyDepositRuleRequest request, Long ruleId) {
        validateGuestRangeOverlap(policyId, request.getMinGuests(), request.getMaxGuests(), ruleId);
    }

    private void validateGuestRangeOverlap(Long policyId, Integer newMin, Integer newMax, Long excludeRuleId) {
        List<ReservationPolicyDepositRule> existingRules = reservationPolicyDepositRuleRepository.findAllByPolicyIdOrderByMinGuestAsc(policyId);

        for (ReservationPolicyDepositRule rule : existingRules) {
            // Loại trừ chính nó khi làm tác vụ Update
            if (excludeRuleId != null && rule.getId().equals(excludeRuleId)) {
                continue;
            }

            int existMin = rule.getMinGuest();
            Integer existMax = rule.getMaxGuest(); // null = vô tận

            // 1. Kiểm tra xem khoảng MỚI có nằm HẲN BÊN TRÁI (trước) khoảng CŨ không
            boolean isNewTotallyBefore = (newMax != null && newMax < existMin);

            // 2. Kiểm tra xem khoảng MỚI có nằm HẲN BÊN PHẢI (sau) khoảng CŨ không
            boolean isNewTotallyAfter = (existMax != null && newMin > existMax);

            // Nếu KHÔNG nằm hẳn bên trái VÀ ALSO KHÔNG nằm hẳn bên phải -> Chắc chắn bị CHỒNG LẤN
            if (!isNewTotallyBefore && !isNewTotallyAfter) {
                throw new BusinessException(PolicyErrorCode.POLICY_RULE_GUEST_RANGE_OVERLAP);
            }
        }
    }

}
