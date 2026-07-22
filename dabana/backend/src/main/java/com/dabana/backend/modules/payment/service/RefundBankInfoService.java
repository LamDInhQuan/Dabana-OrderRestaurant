package com.dabana.backend.modules.payment.service;

import com.dabana.backend.exception.BusinessException;
import com.dabana.backend.modules.booking.Booking;
import com.dabana.backend.modules.booking.BookingRepository;
import com.dabana.backend.modules.payment.dto.request.RefundBankInfoRequest;
import com.dabana.backend.modules.payment.dto.response.RefundBankInfoResponse;
import com.dabana.backend.modules.payment.entity.BankCatalog;
import com.dabana.backend.modules.payment.entity.RefundBankInfo;
import com.dabana.backend.modules.payment.mapper.RefundBankInfoMapper;
import com.dabana.backend.modules.payment.repository.BankCatalogRepository;
import com.dabana.backend.modules.payment.repository.RefundBankInfoRepository;
import com.dabana.backend.modules.payment.util.PaymentErrorCode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RefundBankInfoService {

    private final RefundBankInfoRepository refundBankInfoRepository;
    private final BankCatalogRepository bankCatalogRepository;
    private final BookingRepository bookingRepository;
    private final RefundBankInfoMapper refundBankInfoMapper;

    public RefundBankInfoService(RefundBankInfoRepository refundBankInfoRepository,
                                  BankCatalogRepository bankCatalogRepository,
                                  BookingRepository bookingRepository,
                                  RefundBankInfoMapper refundBankInfoMapper) {
        this.refundBankInfoRepository = refundBankInfoRepository;
        this.bankCatalogRepository = bankCatalogRepository;
        this.bookingRepository = bookingRepository;
        this.refundBankInfoMapper = refundBankInfoMapper;
    }

    /** Upsert: khach co the sua lai thong tin tk hoan tien mien la chua tao lenh chi. */
    @Transactional
    public RefundBankInfoResponse createOrUpdate(RefundBankInfoRequest request) {
        Booking booking = bookingRepository.findById(request.getReservationId())
                .orElseThrow(() -> new BusinessException(PaymentErrorCode.RESERVATION_NOT_FOUND));

        BankCatalog bank = bankCatalogRepository.findById(request.getBankId())
                .filter(BankCatalog::getIsActive)
                .orElseThrow(() -> new BusinessException(PaymentErrorCode.BANK_NOT_FOUND));

        RefundBankInfo entity = refundBankInfoRepository.findByReservation_Id(booking.getId())
                .orElseGet(RefundBankInfo::new);
        entity.setReservation(booking);
        entity.setBank(bank);
        entity.setAccountNumber(request.getAccountNumber());
        entity.setAccountHolderName(request.getAccountHolderName());

        entity = refundBankInfoRepository.save(entity);
        return refundBankInfoMapper.toResponse(entity);
    }

    public RefundBankInfoResponse getByReservation(Long reservationId) {
        RefundBankInfo entity = refundBankInfoRepository.findByReservation_Id(reservationId)
                .orElseThrow(() -> new BusinessException(PaymentErrorCode.REFUND_BANK_INFO_NOT_FOUND));
        return refundBankInfoMapper.toResponse(entity);
    }
}