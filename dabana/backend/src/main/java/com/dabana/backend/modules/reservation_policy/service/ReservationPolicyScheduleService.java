package com.dabana.backend.modules.reservation_policy.service;

import com.dabana.backend.exception.BusinessException;
import com.dabana.backend.modules.reservation_policy.dto.request.CreateReservationPolicyScheduleRequest;
import com.dabana.backend.modules.reservation_policy.dto.response.ReservationPolicyScheduleResponse;
import com.dabana.backend.modules.reservation_policy.entity.ReservationPolicy;
import com.dabana.backend.modules.reservation_policy.entity.ReservationPolicySchedule;
import com.dabana.backend.modules.reservation_policy.mapper.ReservationPolicyScheduleMapper;
import com.dabana.backend.modules.reservation_policy.repository.ReservationPolicyRepository;
import com.dabana.backend.modules.reservation_policy.repository.ReservationPolicyScheduleRepository;
import com.dabana.backend.modules.reservation_policy.util.PolicyErrorCode;
import com.dabana.backend.modules.reservation_policy.util.PolicyScheduleType;
import com.dabana.backend.modules.restaurant.RestaurantErrorCode;
import com.dabana.backend.modules.restaurant.repository.RestaurantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ReservationPolicyScheduleService implements IReservationPolicyScheduleService {

    private final RestaurantRepository restaurantRepository;
    private final ReservationPolicyRepository reservationPolicyRepository;
    private final ReservationPolicyScheduleRepository reservationPolicyScheduleRepository;
    private final ReservationPolicyScheduleMapper reservationPolicyScheduleMapper;

    @Override
    @Transactional
    public ReservationPolicyScheduleResponse create(Long restaurantId, Long policyId, CreateReservationPolicyScheduleRequest request) {
        restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new BusinessException(RestaurantErrorCode.RESTAURANT_NOT_FOUND));

        ReservationPolicy policy = reservationPolicyRepository.findByIdAndRestaurantId(policyId, restaurantId)
                .orElseThrow(() -> new BusinessException(PolicyErrorCode.POLICY_NOT_FOUND));

        validateSchedule(policy, request, null);

        ReservationPolicySchedule entity = reservationPolicyScheduleMapper.toEntity(request, policy);
        return reservationPolicyScheduleMapper.toResponse(reservationPolicyScheduleRepository.save(entity));
    }

    @Override
    @Transactional
    public ReservationPolicyScheduleResponse update(Long restaurantId, Long policyId, Long scheduleId, CreateReservationPolicyScheduleRequest request) {
        restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new BusinessException(RestaurantErrorCode.RESTAURANT_NOT_FOUND));

        ReservationPolicy policy = reservationPolicyRepository.findByIdAndRestaurantId(policyId, restaurantId)
                .orElseThrow(() -> new BusinessException(PolicyErrorCode.POLICY_NOT_FOUND));

        ReservationPolicySchedule entity = reservationPolicyScheduleRepository.findByIdAndPolicyId(scheduleId, policyId)
                .orElseThrow(() -> new BusinessException(PolicyErrorCode.SCHEDULE_NOT_FOUND));
        validateSchedule(policy, request, scheduleId);
        entity.setDayOfWeek(request.getDayOfWeek());
        entity.setDateFrom(request.getDateFrom());
        entity.setDateTo(request.getDateTo());
        entity.setTimeFrom(request.getTimeFrom());
        entity.setTimeTo(request.getTimeTo());
        entity.setStatus(request.getStatus());
        return reservationPolicyScheduleMapper.toResponse(reservationPolicyScheduleRepository.save(entity));
    }

    @Override
    @Transactional
    public void delete(Long restaurantId, Long policyId, Long scheduleId) {
        restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new BusinessException(RestaurantErrorCode.RESTAURANT_NOT_FOUND));

        reservationPolicyRepository.findByIdAndRestaurantId(policyId, restaurantId)
                .orElseThrow(() -> new BusinessException(PolicyErrorCode.POLICY_NOT_FOUND));

        ReservationPolicySchedule entity = reservationPolicyScheduleRepository.findByIdAndPolicyId(scheduleId, policyId)
                .orElseThrow(() -> new BusinessException(PolicyErrorCode.SCHEDULE_NOT_FOUND));

        reservationPolicyScheduleRepository.delete(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public ReservationPolicyScheduleResponse getDetail(Long restaurantId, Long policyId, Long scheduleId) {
        restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new BusinessException(RestaurantErrorCode.RESTAURANT_NOT_FOUND));

        reservationPolicyRepository.findByIdAndRestaurantId(policyId, restaurantId)
                .orElseThrow(() -> new BusinessException(PolicyErrorCode.POLICY_NOT_FOUND));

        ReservationPolicySchedule entity = reservationPolicyScheduleRepository.findByIdAndPolicyId(scheduleId, policyId)
                .orElseThrow(() -> new BusinessException(PolicyErrorCode.SCHEDULE_NOT_FOUND));

        return reservationPolicyScheduleMapper.toResponse(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReservationPolicyScheduleResponse> getAll(Long restaurantId, Long policyId) {
        restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new BusinessException(RestaurantErrorCode.RESTAURANT_NOT_FOUND));

        reservationPolicyRepository.findByIdAndRestaurantId(policyId, restaurantId)
                .orElseThrow(() -> new BusinessException(PolicyErrorCode.POLICY_NOT_FOUND));

        return reservationPolicyScheduleRepository.findAllByPolicyIdOrderByIdAsc(policyId)
                .stream()
                .map(reservationPolicyScheduleMapper::toResponse)
                .toList();
    }

    private void validateSchedule(
            ReservationPolicy policy,
            CreateReservationPolicyScheduleRequest request,
            Long excludeId) {

        validateScheduleType(
                policy.getScheduleType(),
                request.getDayOfWeek(),
                request.getDateFrom(),
                request.getDateTo(),
                request.getTimeFrom(),
                request.getTimeTo());

        validateBusinessRule(
                policy.getId(),
                policy.getScheduleType(),
                request.getDayOfWeek(),
                request.getDateFrom(),
                request.getDateTo(),
                excludeId);
    }
    private void validateBusinessRule(
            Long policyId,
            PolicyScheduleType scheduleType,
            Integer dayOfWeek,
            LocalDate dateFrom,
            LocalDate dateTo,
            Long excludeId) {

        switch (scheduleType) {
            case ALWAYS -> {
                List<ReservationPolicySchedule> schedules =
                        reservationPolicyScheduleRepository.findAllByPolicyIdOrderByIdAsc(policyId);
                boolean exists = schedules.stream()
                        .anyMatch(s -> excludeId == null || !s.getId().equals(excludeId));
                if (exists) {
                    throw new BusinessException(PolicyErrorCode.POLICY_SCHEDULE_ALREADY_EXISTS);
            }
}
            case DAY_OF_WEEK -> {

                List<ReservationPolicySchedule> schedules = reservationPolicyScheduleRepository.findAllByPolicyIdOrderByIdAsc(policyId);

                boolean duplicated = schedules.stream()
                        .filter(s -> excludeId == null || !s.getId().equals(excludeId))
                        .anyMatch(s -> s.getDayOfWeek().equals(dayOfWeek));

                if (duplicated) {
                    throw new BusinessException(
                            PolicyErrorCode.POLICY_SCHEDULE_DUPLICATE_DAY);
                }
            }
            case DATE_RANGE -> {
                List<ReservationPolicySchedule> schedules = reservationPolicyScheduleRepository.findAllByPolicyIdOrderByIdAsc(policyId);

                for (ReservationPolicySchedule schedule : schedules) {

                    if (excludeId != null && schedule.getId().equals(excludeId)) {
                        continue;
                    }

                    if (!dateFrom.isAfter(schedule.getDateTo())
                            && !schedule.getDateFrom().isAfter(dateTo)) {

                        throw new BusinessException(
                                PolicyErrorCode.POLICY_SCHEDULE_DATE_RANGE_OVERLAP);
                    }
                }
            }
        }
    }
    private void validateScheduleType(
            PolicyScheduleType scheduleType,
            Integer dayOfWeek,
            LocalDate dateFrom,
            LocalDate dateTo,
            LocalTime timeFrom,
            LocalTime timeTo) {

        if (scheduleType == null) {
            throw new BusinessException(PolicyErrorCode.INVALID_SCHEDULE);
        }

        if (timeFrom != null && timeTo != null && !timeFrom.isBefore(timeTo)) {
            throw new BusinessException(PolicyErrorCode.INVALID_SCHEDULE);
        }

        switch (scheduleType) {

            case ALWAYS -> {
                if (dayOfWeek != null || dateFrom != null || dateTo != null) {
                    throw new BusinessException(PolicyErrorCode.INVALID_SCHEDULE);
                }
            }

            case DAY_OF_WEEK -> {
                if (dayOfWeek == null
                        || dayOfWeek < 1
                        || dayOfWeek > 7
                        || dateFrom != null
                        || dateTo != null) {

                    throw new BusinessException(PolicyErrorCode.INVALID_SCHEDULE);
                }
            }

            case DATE_RANGE -> {

                if (dateFrom == null
                        || dateTo == null
                        || dateFrom.isAfter(dateTo)
                        || dayOfWeek != null) {

                    throw new BusinessException(PolicyErrorCode.INVALID_SCHEDULE);
                }
            }

            default -> throw new BusinessException(
                    PolicyErrorCode.INVALID_SCHEDULE);
        }
    }
}
