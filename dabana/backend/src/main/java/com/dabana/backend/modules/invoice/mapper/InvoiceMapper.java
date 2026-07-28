package com.dabana.backend.modules.invoice.mapper;

import com.dabana.backend.modules.invoice.dto.response.InvoiceResponse;
import com.dabana.backend.modules.invoice.entity.Invoice;
import org.springframework.stereotype.Component;

@Component
public class InvoiceMapper {

    public InvoiceResponse toResponse(Invoice invoice) {
        return InvoiceResponse.builder()
                .id(invoice.getId())
                .bookingId(invoice.getBooking().getId())
                .preorderSubtotal(invoice.getPreorderSubtotal())
                .extraOrderSubtotal(invoice.getExtraOrderSubtotal())
                .surcharge(invoice.getSurcharge())
                .grandTotal(invoice.getGrandTotal())
                .depositPaid(invoice.getDepositPaid())
                .amountCollected(invoice.getGrandTotal().subtract(invoice.getDepositPaid()))
                .paymentMethod(invoice.getPaymentMethod())
                .status(invoice.getStatus())
                .paidAt(invoice.getPaidAt())
                .collectedByName(invoice.getCollectedBy() != null ? invoice.getCollectedBy().getFullName() : null)
                .build();
    }
}
