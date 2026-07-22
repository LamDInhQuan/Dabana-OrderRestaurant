package com.dabana.backend.modules.extraorder.mapper;

import com.dabana.backend.modules.extraorder.dto.response.ExtraOrderResponse;
import com.dabana.backend.modules.extraorder.entity.ExtraOrder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class ExtraOrderMapper {

    public ExtraOrderResponse toResponse(ExtraOrder entity) {
        ExtraOrderResponse response = new ExtraOrderResponse();
        response.setId(entity.getId());
        response.setBookingId(entity.getBooking() != null ? entity.getBooking().getId() : null);
        response.setMenuItemId(entity.getMenuItem() != null ? entity.getMenuItem().getId() : null);
        response.setItemNameAtTime(entity.getItemNameAtTime());
        response.setPriceAtTime(entity.getPriceAtTime());
        response.setQuantity(entity.getQuantity());
        response.setLineTotal(
                entity.getPriceAtTime() != null && entity.getQuantity() != null
                        ? entity.getPriceAtTime().multiply(BigDecimal.valueOf(entity.getQuantity()))
                        : BigDecimal.ZERO
        );
        response.setRecordedByUserId(entity.getRecordedBy() != null ? entity.getRecordedBy().getId() : null);
        response.setRecordedByName(entity.getRecordedBy() != null ? entity.getRecordedBy().getFullName() : null);
        response.setCreatedAt(entity.getCreatedAt());
        return response;
    }
}
