package com.dabana.backend.modules.branch2.util;

import com.dabana.backend.exception.ErrorCode;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum BranchErrorCode implements ErrorCode {
    // ==========================
    // Branch Business Errors
    // ==========================
    BRANCH_NOT_FOUND(
            "BRANCH_001",
            "Không tìm thấy chi nhánh yêu cầu."
    ),

    RESTAURANT_NOT_FOUND(
            "BRANCH_002",
            "Nhà hàng đối tác không tồn tại."
    ),

    DUPLICATE_PHONE(
            "BRANCH_003",
            "Số điện thoại chi nhánh này đã được đăng ký hệ thống."
    ),

    INVALID_COORDINATES(
            "BRANCH_004",
            "Tọa độ kinh độ hoặc vĩ độ không hợp lệ."
    ),

    BRANCH_NOT_ACTIVE(
            "BRANCH_005",
            "Chi nhánh này hiện đã tạm ngưng hoạt động."
    ),

    // Operating Hour
    // ==========================
    INVALID_OPERATING_TIME(
            "BRANCH_101",
            "Giờ mở cửa phải nhỏ hơn giờ đóng cửa."
    ),

    OVERLAPPING_OPERATING_HOURS(
            "BRANCH_102",
            "Các ca hoạt động trong cùng ngày không được chồng lấn."
    ),

    EMPTY_OPERATING_HOURS(
            "BRANCH_103",
            "Chi nhánh phải có ít nhất một khung giờ hoạt động."
    ),

    DUPLICATE_OPERATING_HOURS(
            "BRANCH_104",
            "Khung giờ hoạt động bị trùng lặp."
    ),

    INVALID_OPERATING_DURATION(
            "BRANCH_105",
            "Thời gian hoạt động của một ca không hợp lệ."
    ),

    // ==========================
// Branch Schedule Exception
// ==========================


    EXCEPTION_NOT_FOUND(
            "BRANCH_201",
            "Không tìm thấy lịch ngoại lệ của chi nhánh."
    ),

    INVALID_DATE_RANGE(
            "BRANCH_202",
            "Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu."
    ),

    EXCEPTION_OVERLAP(
            "BRANCH_203",
            "Khoảng thời gian áp dụng bị trùng với lịch ngoại lệ khác."
    ),

    INVALID_EXCEPTION_CONFIGURATION(
            "BRANCH_204",
            "Cấu hình lịch ngoại lệ không hợp lệ."
    ),

    OPERATING_HOUR_NOT_FOUND(
            "BRANCH_205",
            "Không tìm thấy ca hoạt động."
    ),

    OPERATING_HOUR_NOT_BELONG_BRANCH(
            "BRANCH_206",
            "Ca hoạt động không thuộc chi nhánh này."
    ),

    INVALID_TIME_RANGE(
            "BRANCH_207",
            "Giờ bắt đầu phải nhỏ hơn giờ kết thúc."
    ),

    TIME_RANGE_OUTSIDE_OPERATING_HOUR(
            "BRANCH_208",
            "Khoảng thời gian phải nằm trong ca hoạt động được chọn."
    ),

    OPERATING_HOUR_REQUIRED(
            "BRANCH_209",
            "Phải chọn ca hoạt động."
    ),

    OPERATING_HOUR_NOT_ALLOWED(
            "BRANCH_210",
            "Loại lịch ngoại lệ này không được phép chọn ca hoạt động."
    ),

    TIME_RANGE_REQUIRED(
            "BRANCH_211",
            "Phải khai báo giờ bắt đầu và giờ kết thúc."
    ),

    TIME_RANGE_NOT_ALLOWED(
            "BRANCH_212",
            "Loại lịch ngoại lệ này không được phép khai báo khoảng thời gian."
    ),

    ADD_TIME_RANGE_OVERLAP(
            "BRANCH_213",
            "Ca hoạt động bổ sung bị trùng với lịch hoạt động hiện có."
    ),

    OVERRIDE_TIME_RANGE_INVALID(
            "BRANCH_214",
            "Giờ hoạt động ghi đè không hợp lệ."
    ),
    SINGLE_DAY_REQUIRED(
            "BRANCH_215",
            "Loại lịch ngoại lệ này chỉ được áp dụng cho một ngày."
    ),
    OPERATING_HOUR_NOT_MATCH_DATE(
            "BRANCH_216",
            "Thứ của ngày bắt đầu không trùng khớp với thứ bạn đã chọn."
    ),
    OPERATING_DAY_NOT_VALID(
            "BRANCH_217",
            "Thứ trong tuần bạn gửi lên không hợp lệ."
    ), SCHEDULE_EXCEPTION_NOT_FOUND("BRANCH_218", "Không tìm thấy cấu hình ngoại lệ lịch trình chi nhánh"), // Hoặc cú pháp tương ứng của project bạn
    ;

    private final String code;
    private final String message;
}
