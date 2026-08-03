package com.dabana.backend.modules.diningtable.scheduler;

import com.dabana.backend.modules.diningtable.service.IDiningTableService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Tác vụ định kỳ cho bàn ăn:
 * - Tự động chuyển các bàn ở trạng thái CLEANING (Dọn dẹp) sang EMPTY (Trống)
 *   sau 15 phút nếu nhân viên/nhà hàng không đổi thủ công.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DiningTableScheduledTasks {

    private final IDiningTableService diningTableService;

    public void autoReleaseCleaningTables() {
        try {
            diningTableService.autoReleaseCleaningTables();
        } catch (Exception e) {
            log.error("Lỗi khi tự động giải phóng bàn dọn dẹp:", e);
        }
    }
}
