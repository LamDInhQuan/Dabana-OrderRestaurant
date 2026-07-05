package com.dabana.backend.exception;

import com.dabana.backend.modules.auth.util.AuthErrorCode;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<Map<String, Object>> handleBusinessException(BusinessException ex) {
        Map<String, Object> body = errorBody(ex.getErrorCode(), ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(UsernameNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleBadCredentials(UsernameNotFoundException ex) {
        ErrorCode authErrorCode = AuthErrorCode.USER_NOT_FOUND;
        Map<String, Object> body = errorBody(authErrorCode.getCode(), authErrorCode.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(body);
    }
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, Object>> handleBadCredentials(BadCredentialsException ex) {
        ErrorCode authErrorCode = AuthErrorCode.PASSWORD_INCORRECT;
        Map<String, Object> body = errorBody(authErrorCode.getCode(), authErrorCode.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(body);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(fe ->
                fieldErrors.put(fe.getField(), fe.getDefaultMessage()));

        Map<String, Object> body = errorBody("VALIDATION_ERROR", "Du lieu khong hop le");
        body.put("fields", fieldErrors);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneric(Exception ex) {
        Map<String, Object> body = errorBody("INTERNAL_ERROR", "Da xay ra loi he thong");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }

    @ExceptionHandler(DisabledException.class) // status chưa xác thưc account mặc định của spring security
    public ResponseEntity<?> handleDisabled(DisabledException ex) {
        ErrorCode authErrorCode = AuthErrorCode.ACCOUNT_NOT_VERIFIED;
        Map<String, Object> body = errorBody(authErrorCode.getCode(), authErrorCode.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(body);
    }

    @ExceptionHandler(LockedException.class) // status khóa account mặc định của spring security
    public ResponseEntity<?> handleLocked(LockedException ex) {
        ErrorCode authErrorCode = AuthErrorCode.ACCOUNT_DISABLED;
        Map<String, Object> body = errorBody(authErrorCode.getCode(), authErrorCode.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(body);
    }

    private Map<String, Object> errorBody(String code, String message) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("errorCode", code);
        body.put("message", message);
        return body;
    }
}
