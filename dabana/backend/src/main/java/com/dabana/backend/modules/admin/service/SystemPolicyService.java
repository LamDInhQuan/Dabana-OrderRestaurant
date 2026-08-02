package com.dabana.backend.modules.admin.service;

import com.dabana.backend.modules.admin.dto.CancellationGracePeriodDto;
import com.dabana.backend.modules.admin.entity.SystemSetting;
import com.dabana.backend.modules.admin.repository.SystemSettingRepository;
import com.dabana.backend.modules.booking.Booking;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class SystemPolicyService implements ISystemPolicyService {

    public static final String KEY_GRACE_PERIOD_MINUTES = "CONFIRMED_CANCELLATION_GRACE_PERIOD_MINUTES";
    public static final String KEY_GRACE_PERIOD_ENABLED = "CONFIRMED_CANCELLATION_GRACE_PERIOD_ENABLED";
    public static final String KEY_GRACE_PERIOD_DESCRIPTION = "CONFIRMED_CANCELLATION_GRACE_PERIOD_DESCRIPTION";

    public static final int DEFAULT_GRACE_PERIOD_MINUTES = 15;
    public static final boolean DEFAULT_GRACE_PERIOD_ENABLED = true;
    public static final String DEFAULT_DESCRIPTION = "Khách hàng được hoàn 100% tiền cọc nếu huỷ đơn trong thời gian ân hạn kể từ khi đơn chuyển sang Đã xác nhận (CONFIRMED).";

    private final SystemSettingRepository systemSettingRepository;

    @Override
    public CancellationGracePeriodDto getCancellationGracePeriodPolicy() {
        int minutes = getGracePeriodMinutes();
        boolean enabled = isGracePeriodEnabled();
        String description = systemSettingRepository.findBySettingKey(KEY_GRACE_PERIOD_DESCRIPTION)
                .map(SystemSetting::getSettingValue)
                .orElse(DEFAULT_DESCRIPTION);

        return CancellationGracePeriodDto.builder()
                .gracePeriodMinutes(minutes)
                .enabled(enabled)
                .description(description)
                .build();
    }

    @Override
    @Transactional
    public CancellationGracePeriodDto updateCancellationGracePeriodPolicy(CancellationGracePeriodDto request) {
        saveOrUpdateSetting(KEY_GRACE_PERIOD_MINUTES,
                String.valueOf(request.getGracePeriodMinutes()),
                "Thời gian ân hạn huỷ đơn sau khi xác nhận (phút)");

        saveOrUpdateSetting(KEY_GRACE_PERIOD_ENABLED,
                String.valueOf(request.getEnabled()),
                "Trạng thái bật/tắt chính sách ân hạn huỷ đơn");

        if (request.getDescription() != null) {
            saveOrUpdateSetting(KEY_GRACE_PERIOD_DESCRIPTION,
                    request.getDescription(),
                    "Mô tả chính sách ân hạn huỷ đơn");
        }

        log.info("Admin da cap nhat chinh sach an han huy don: minutes={}, enabled={}",
                request.getGracePeriodMinutes(), request.getEnabled());

        return getCancellationGracePeriodPolicy();
    }

    private void saveOrUpdateSetting(String key, String value, String description) {
        SystemSetting setting = systemSettingRepository.findBySettingKey(key)
                .orElseGet(() -> SystemSetting.builder()
                        .settingKey(key)
                        .description(description)
                        .build());
        setting.setSettingValue(value);
        if (description != null) {
            setting.setDescription(description);
        }
        systemSettingRepository.save(setting);
    }

    @Override
    public int getGracePeriodMinutes() {
        return systemSettingRepository.findBySettingKey(KEY_GRACE_PERIOD_MINUTES)
                .map(s -> {
                    try {
                        return Integer.parseInt(s.getSettingValue());
                    } catch (Exception e) {
                        return DEFAULT_GRACE_PERIOD_MINUTES;
                    }
                })
                .orElse(DEFAULT_GRACE_PERIOD_MINUTES);
    }

    @Override
    public boolean isGracePeriodEnabled() {
        return systemSettingRepository.findBySettingKey(KEY_GRACE_PERIOD_ENABLED)
                .map(s -> "true".equalsIgnoreCase(s.getSettingValue()))
                .orElse(DEFAULT_GRACE_PERIOD_ENABLED);
    }

    @Override
    public boolean isWithinCancellationGracePeriod(Booking booking) {
        if (booking == null || !isGracePeriodEnabled()) {
            return false;
        }
        int minutes = getGracePeriodMinutes();
        if (minutes <= 0) {
            return false;
        }

        LocalDateTime confirmedAt = getEffectiveConfirmedAt(booking);
        if (confirmedAt == null) {
            return false;
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime deadline = confirmedAt.plusMinutes(minutes);

        // Đơn phải còn trước giờ hẹn và trước thời hạn ân hạn
        boolean beforeReservation = booking.getReservationTime() == null || now.isBefore(booking.getReservationTime());
        return now.isBefore(deadline) && beforeReservation;
    }

    @Override
    public Long getRemainingGracePeriodSeconds(Booking booking) {
        if (!isWithinCancellationGracePeriod(booking)) {
            return 0L;
        }
        int minutes = getGracePeriodMinutes();
        LocalDateTime confirmedAt = getEffectiveConfirmedAt(booking);
        if (confirmedAt == null) {
            return 0L;
        }
        LocalDateTime deadline = confirmedAt.plusMinutes(minutes);
        LocalDateTime now = LocalDateTime.now();
        long seconds = Duration.between(now, deadline).getSeconds();
        return Math.max(0L, seconds);
    }

    @Override
    public LocalDateTime getEffectiveConfirmedAt(Booking booking) {
        if (booking == null) {
            return null;
        }
        if (booking.getConfirmedAt() != null) {
            return booking.getConfirmedAt();
        }
        // Fallback sang createdAt nếu confirmedAt chưa kịp lưu cho các đơn cũ
        return booking.getCreatedAt();
    }
}
