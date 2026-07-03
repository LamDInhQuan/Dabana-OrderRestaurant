package com.dabana.backend.common;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum SuccessCode {
    SUCCESS("SUCCESS","Thành công"),

    CREATED("CREATED","Tạo thành công"),

    UPDATED("UPDATED","Cập nhật thành công"),

    DELETED("DELETED","Xóa thành công");

    private final String status ;
    private final String message ;
}
