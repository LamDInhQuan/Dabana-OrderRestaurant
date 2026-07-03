package com.dabana.backend.common;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ApiResponse<T> {

    private LocalDateTime timestamp;

    private int status;

    private String code;

    private String message;

    private T data;
}