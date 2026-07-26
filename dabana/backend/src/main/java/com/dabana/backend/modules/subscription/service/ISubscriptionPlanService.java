package com.dabana.backend.modules.subscription.service;

import com.dabana.backend.modules.subscription.dto.request.CreateSubscriptionPlanRequest;
import com.dabana.backend.modules.subscription.dto.request.UpdateSubscriptionPlanRequest;
import com.dabana.backend.modules.subscription.dto.response.SubscriptionPlanResponse;

import java.util.List;

public interface ISubscriptionPlanService {

    /** Danh sach goi dang mo ban (status = ACTIVE), sap theo displayOrder - dung cho trang gia cong khai. */
    List<SubscriptionPlanResponse> listActivePlans();

    /** Toan bo goi (ca INACTIVE) - dung cho man quan tri Admin. */
    List<SubscriptionPlanResponse> listAllPlans();

    SubscriptionPlanResponse createPlan(CreateSubscriptionPlanRequest request);

    SubscriptionPlanResponse updatePlan(Long planId, UpdateSubscriptionPlanRequest request);
}
