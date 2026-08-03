package com.dabana.backend.modules.auth.controller;

import com.dabana.backend.common.ApiResponse;
import com.dabana.backend.common.ResponseBuilder;
import com.dabana.backend.common.SuccessCode;
import com.dabana.backend.modules.auth.dto.request.*;
import com.dabana.backend.modules.auth.service.OtpService;
import com.dabana.backend.modules.restaurant.Dto.request.RestaurantRegisterRequest;
import com.dabana.backend.modules.restaurant.service.RestaurantService;
import com.dabana.backend.modules.auth.dto.response.UserResponse;
import com.dabana.backend.modules.auth.service.AuthService;
import com.dabana.backend.security.CurrentUserProvider;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import java.util.List;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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
    private final CurrentUserProvider currentUserProvider;
    private final RestaurantService restaurantService;

    @PostMapping("/register/customer")
    public ResponseEntity<ApiResponse<UserResponse>> registerCustomer(@Valid @RequestBody RegisterAccountRequest request) {
        UserResponse userResponse = authService.registerCustomer(request);
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.CREATED, userResponse));
    }

    //TODO: tối ưu đăng ký đối tác
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE ,
        path = "/register/partner")
    public ResponseEntity<ApiResponse<UserResponse>> registerPartner(
        @Valid @RequestPart("request") String requestjson, 
        @Valid @RequestPart("restaurantRegisterRequest") String restaurantRegisterRequestJson, 
        @Valid @RequestPart(value = "licenses", required = true) List<MultipartFile> licenses,
        ObjectMapper mapper) throws JsonProcessingException {
    
        RegisterAccountRequest registerAccountRequest = mapper.readValue(requestjson, RegisterAccountRequest.class);
        RestaurantRegisterRequest restaurantRegisterRequest = mapper.readValue(restaurantRegisterRequestJson, RestaurantRegisterRequest.class);

        UserResponse userResponse = authService.registerPartner(registerAccountRequest,restaurantRegisterRequest);
        restaurantService.uploadLicenses(userResponse.getId(),licenses);

        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.CREATED, userResponse));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<Boolean>> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        Boolean result = authService.verifyOtp(request);
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS, result));
    }

    /** Gui lai OTP qua email khi ma cu het han hoac chua nhan duoc email. */
    @PostMapping("/resend-otp")
    public ResponseEntity<ApiResponse<Boolean>> resendOtp(@Valid @RequestBody ResendOtpRequest request) {
        Boolean result = authService.resendOtp(request.getIdentifier());
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

    /** Quen mat khau: nhap email da dang ky, mat khau moi se duoc gui ve email do. */
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Boolean>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        Boolean result = authService.forgotPassword(request);
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS, result));
    }
    @PostMapping("/send-otp")
    public ResponseEntity<ApiResponse<String>> sendOtp(@Valid @RequestBody SendOtpRequest request) {
        String result = otpService.generateAndSend(request.getEmail() , request.getPurpose());
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS, result));
    }


    /** Doi mat khau: nguoi dung da dang nhap nhap mat khau hien tai + mat khau moi. */
    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<Boolean>> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        Long userId = currentUserProvider.getCurrentUserId();
        Boolean result = authService.changePassword(userId, request);
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS, result));
    }
}
