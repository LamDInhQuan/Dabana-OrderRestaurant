package com.dabana.backend.modules.auth.service;

import com.dabana.backend.modules.auth.dto.request.ChangePasswordRequest;
import com.dabana.backend.modules.auth.dto.request.ForgotPasswordRequest;
import com.dabana.backend.modules.auth.dto.request.LoginRequest;
import com.dabana.backend.modules.auth.dto.request.RefreshTokenRequest;
import com.dabana.backend.modules.auth.dto.request.RegisterAccountRequest;
import com.dabana.backend.modules.auth.dto.request.VerifyOtpRequest;
import com.dabana.backend.modules.auth.dto.response.UserResponse;
import com.dabana.backend.modules.restaurant.Dto.request.RestaurantRegisterRequest;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface IAuthService {
    UserResponse registerCustomer(RegisterAccountRequest request);

    UserResponse registerPartner(RegisterAccountRequest request, RestaurantRegisterRequest restaurantRegisterRequest, List<MultipartFile> licenses);

    Boolean verifyOtp(VerifyOtpRequest req);

    Boolean resendOtp(String identifier);

    UserResponse login(LoginRequest request);

    UserResponse refresh(RefreshTokenRequest request);

    Boolean forgotPassword(ForgotPasswordRequest request);

    Boolean changePassword(Long userId, ChangePasswordRequest request);
}
