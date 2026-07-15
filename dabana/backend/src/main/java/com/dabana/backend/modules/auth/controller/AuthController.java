package com.dabana.backend.modules.auth.controller;

import com.dabana.backend.common.ApiResponse;
import com.dabana.backend.common.ResponseBuilder;
import com.dabana.backend.common.SuccessCode;
import com.dabana.backend.modules.auth.service.OtpService;
import com.dabana.backend.modules.auth.dto.request.LoginRequest;
import com.dabana.backend.modules.auth.dto.request.RefreshTokenRequest;
import com.dabana.backend.modules.auth.dto.request.RegisterAccountRequest;
import com.dabana.backend.modules.auth.dto.request.VerifyOtpRequest;
import com.dabana.backend.modules.auth.dto.response.UserResponse;
import com.dabana.backend.modules.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * /api/auth - dang ky, dang nhap, lam moi token, quan ly phien dang nhap
 * cho ca ba vai tro (theo 3.6 thiet ke API).
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final OtpService otpService;

    @PostMapping("/register/customer")
    public ResponseEntity<ApiResponse<UserResponse>> registerCustomer(@Valid @RequestBody RegisterAccountRequest request) {
        UserResponse userResponse = authService.register(request);
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.CREATED, userResponse));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<Boolean>> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        Boolean result = authService.verifyOtp(request);
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS, result));
    }

    //
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<UserResponse>> login(@Valid @RequestBody LoginRequest request) {
        UserResponse result = authService.login(request);
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS, result));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<UserResponse>> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        UserResponse result = authService.refresh(request);
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS, result));
    }
}
