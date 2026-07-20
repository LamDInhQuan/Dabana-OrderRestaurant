package com.dabana.backend.modules.auth.service;

import com.dabana.backend.modules.auth.dto.request.ForgotPasswordRequest;
import com.dabana.backend.modules.auth.dto.request.LoginRequest;
import com.dabana.backend.modules.auth.dto.request.RefreshTokenRequest;
import com.dabana.backend.modules.auth.dto.request.RegisterAccountRequest;
import com.dabana.backend.modules.auth.dto.request.VerifyOtpRequest;
import com.dabana.backend.modules.auth.dto.response.UserResponse;

public interface IAuthService {
    UserResponse register(RegisterAccountRequest request);

    Boolean verifyOtp(VerifyOtpRequest req);

    Boolean resendOtp(String identifier);

    UserResponse login(LoginRequest request);

    UserResponse refresh(RefreshTokenRequest request);

    Boolean forgotPassword(ForgotPasswordRequest request);
}
