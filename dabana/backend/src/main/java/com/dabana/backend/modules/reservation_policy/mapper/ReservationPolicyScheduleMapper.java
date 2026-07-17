package com.dabana.backend.modules.reservation_policy.mapper;

import com.dabana.backend.modules.reservation_policy.dto.request.CreateReservationPolicyScheduleRequest;
import com.dabana.backend.modules.reservation_policy.dto.response.ReservationPolicyScheduleResponse;
import com.dabana.backend.modules.reservation_policy.entity.ReservationPolicy;
import com.dabana.backend.modules.reservation_policy.entity.ReservationPolicySchedule;
import org.springframework.stereotype.Component;

@Component
public class ReservationPolicyScheduleMapper {

    public ReservationPolicySchedule toEntity(CreateReservationPolicyScheduleRequest request, ReservationPolicy policy) {
        return ReservationPolicySchedule.builder()
                .policy(policy)
                .dayOfWeek(request.getDayOfWeek())
                .dateFrom(request.getDateFrom())
                .dateTo(request.getDateTo())
                .timeFrom(request.getTimeFrom())
                .timeTo(request.getTimeTo())
                .status(request.getStatus())
                .build();
    }

    public ReservationPolicyScheduleResponse toResponse(ReservationPolicySchedule entity) {
        return ReservationPolicyScheduleResponse.builder()
                .id(entity.getId())
                .policyId(entity.getPolicy().getId())
                .dayOfWeek(entity.getDayOfWeek())
                .dateFrom(entity.getDateFrom())
                .dateTo(entity.getDateTo())
                .timeFrom(entity.getTimeFrom())
                .timeTo(entity.getTimeTo())
                .status(entity.getStatus())
                .build();
    }
}
