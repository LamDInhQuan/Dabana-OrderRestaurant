package com.dabana.backend.modules.extraorder.service;

import com.dabana.backend.modules.auth.entity.User;
import com.dabana.backend.modules.extraorder.dto.request.AddExtraOrderRequest;
import com.dabana.backend.modules.extraorder.dto.request.UpdateExtraOrderQuantityRequest;
import com.dabana.backend.modules.extraorder.dto.response.ExtraOrderResponse;

import java.util.List;

public interface IExtraOrderService {

    /** Liet ke mon goi them cua 1 booking, dung khi ghep voi rs_preorder_items o tang service B12/B01. */
    List<ExtraOrderResponse> getByBooking(Long bookingId);

    /** Them 1 dong mon goi them - chi cho phep khi booking dang CHECKED_IN. */
    ExtraOrderResponse addItem(AddExtraOrderRequest request, User currentUser);

    /** Sua so luong 1 dong da ghi nhan - cap nhat lai recorded_by_user_id theo nguoi sua gan nhat. */
    ExtraOrderResponse updateQuantity(Long extraOrderId, UpdateExtraOrderQuantityRequest request, User currentUser);

    /** Xoa han 1 dong mon goi them (nham/huy mon). */
    void deleteItem(Long extraOrderId);
}