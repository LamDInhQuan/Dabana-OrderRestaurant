package com.dabana.backend.common;

import com.dabana.backend.exception.ErrorCode;

import java.time.LocalDateTime;

public class ResponseBuilder {
    public static <T> ApiResponse<T> success(SuccessCode successCode , T data){
        return ApiResponse.<T>builder()
                .timestamp(LocalDateTime.now())
                .status(200)
                .code(successCode.getStatus())
                .message(successCode.getMessage())
                .data(data)
                .build();
    }
    public static <T> ApiResponse<T> error(ErrorCode errorCode) {
        return ApiResponse.<T>builder()
                .timestamp(LocalDateTime.now())
                .status(400) // hoặc errorCode.getStatus() tùy enum của bạn
                .code(errorCode.getCode())
                .message(errorCode.getMessage())
                .data(null)
                .build();
    }
}
