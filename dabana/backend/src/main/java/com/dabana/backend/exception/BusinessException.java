package com.dabana.backend.exception;

import com.dabana.backend.common.ErrorDetail;

import java.util.List;

public class BusinessException extends RuntimeException {
    private final String errorCode;
    private final List<? extends ErrorDetail> errorDetails;

    public BusinessException(ErrorCode errorCode) {
        this(errorCode ,null) ; // goi contructor ben duoi
    }

    public BusinessException(ErrorCode errorCode, List<? extends ErrorDetail> errorDetails) {
        super(errorCode.getMessage());
        this.errorCode = errorCode.getCode();
        this.errorDetails = errorDetails;
    }

    public String getErrorCode() {
        return errorCode;
    }

    public List<? extends ErrorDetail> getErrorDetails() {
        return errorDetails;
    }
}
