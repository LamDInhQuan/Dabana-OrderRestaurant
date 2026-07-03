package com.dabana.backend.common;

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
}
