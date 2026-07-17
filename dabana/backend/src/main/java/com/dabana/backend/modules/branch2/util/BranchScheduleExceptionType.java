package com.dabana.backend.modules.branch2.util;

public enum BranchScheduleExceptionType {
    CLOSE_ALL_DAY, // Đóng cửa hoàn toàn trong khoảng ngày chỉ định.
    CLOSE_TIME_RANGE, // loại bỏ một khoảng giờ.
    ADD_TIME_RANGE , // bổ sung thêm một khoảng giờ.
    OVERRIDE_TIME_RANGE // thay thế lịch hoạt động mặc định.
}
