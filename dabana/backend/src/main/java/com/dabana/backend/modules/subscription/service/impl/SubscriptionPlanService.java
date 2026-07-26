package com.dabana.backend.modules.subscription.service.impl;

import com.dabana.backend.exception.BusinessException;
import com.dabana.backend.modules.subscription.dto.request.CreateSubscriptionPlanRequest;
import com.dabana.backend.modules.subscription.dto.request.UpdateSubscriptionPlanRequest;
import com.dabana.backend.modules.subscription.dto.response.SubscriptionPlanResponse;
import com.dabana.backend.modules.subscription.entity.SubscriptionPlan;
import com.dabana.backend.modules.subscription.enums.PlanStatus;
import com.dabana.backend.modules.subscription.mapper.SubscriptionPlanMapper;
import com.dabana.backend.modules.subscription.repository.SubscriptionPlanRepository;
import com.dabana.backend.modules.subscription.service.ISubscriptionPlanService;
import com.dabana.backend.modules.subscription.util.SubscriptionErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class SubscriptionPlanService implements ISubscriptionPlanService {

    private final SubscriptionPlanRepository planRepository;
    private final SubscriptionPlanMapper planMapper;

    @Override
    @Transactional(readOnly = true)
    public List<SubscriptionPlanResponse> listActivePlans() {
        return planRepository.findByStatusOrderByDisplayOrderAsc(PlanStatus.ACTIVE).stream()
                .map(planMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<SubscriptionPlanResponse> listAllPlans() {
        return planRepository.findAll().stream()
                .sorted((a, b) -> Integer.compare(a.getDisplayOrder(), b.getDisplayOrder()))
                .map(planMapper::toResponse)
                .toList();
    }

    @Override
    public SubscriptionPlanResponse createPlan(CreateSubscriptionPlanRequest request) {
        planRepository.findByPlanCode(request.getPlanCode()).ifPresent(existing -> {
            throw new BusinessException(SubscriptionErrorCode.DUPLICATE_PLAN_CODE);
        });

        SubscriptionPlan plan = new SubscriptionPlan();
        plan.setPlanCode(request.getPlanCode());
        plan.setName(request.getName());
        plan.setPrice(request.getPrice());
        plan.setBillingCycle(request.getBillingCycle());
        plan.setMaxBranches(request.getMaxBranches());
        plan.setDisplayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0);
        plan.setDescription(request.getDescription());
        plan.setStatus(PlanStatus.ACTIVE);

        return planMapper.toResponse(planRepository.save(plan));
    }

    @Override
    public SubscriptionPlanResponse updatePlan(Long planId, UpdateSubscriptionPlanRequest request) {
        SubscriptionPlan plan = planRepository.findById(planId)
                .orElseThrow(() -> new BusinessException(SubscriptionErrorCode.PLAN_NOT_FOUND));

        // Khong cho sua planCode/billingCycle - xem comment trong UpdateSubscriptionPlanRequest.
        plan.setName(request.getName());
        plan.setPrice(request.getPrice());
        plan.setMaxBranches(request.getMaxBranches());
        if (request.getDisplayOrder() != null) {
            plan.setDisplayOrder(request.getDisplayOrder());
        }
        plan.setDescription(request.getDescription());
        plan.setStatus(request.getStatus());

        return planMapper.toResponse(planRepository.save(plan));
    }
}
