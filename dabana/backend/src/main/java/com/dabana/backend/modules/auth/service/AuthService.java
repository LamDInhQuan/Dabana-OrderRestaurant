package com.dabana.backend.modules.auth.service;

import com.dabana.backend.exception.BusinessException;
//import com.dabana.backend.modules.auth.OtpService;
import com.dabana.backend.modules.auth.service.OtpService;
import com.dabana.backend.modules.auth.dto.request.LoginRequest;
import com.dabana.backend.modules.auth.dto.request.RefreshTokenRequest;
import com.dabana.backend.modules.auth.dto.request.RegisterAccountRequest;
import com.dabana.backend.modules.auth.dto.request.VerifyOtpRequest;
import com.dabana.backend.modules.auth.dto.response.UserResponse;
import com.dabana.backend.modules.auth.entity.Role;
import com.dabana.backend.modules.auth.entity.User;
import com.dabana.backend.modules.auth.entity.UserRole;
import com.dabana.backend.modules.auth.mapper.UserMapper;
import com.dabana.backend.modules.auth.repository.RoleRepository;
import com.dabana.backend.modules.auth.repository.UserRepository;
import com.dabana.backend.modules.auth.repository.UserRoleRepository;
import com.dabana.backend.modules.auth.util.AccountStatus;
import com.dabana.backend.modules.auth.util.AuthErrorCode;
import com.dabana.backend.modules.auth.util.RoleUser;
import com.dabana.backend.security.CustomUserDetail;
import com.dabana.backend.security.CustomUserDetailsService;
import com.dabana.backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;

/**
 * Trien khai dac ta B02: Dang ky va tro thanh nha hang doi tac
 * (va dang ky khach hang thong thuong dung chung quy trinh don gian hoa).
 */
@Service
@RequiredArgsConstructor
public class AuthService implements IAuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository ;
    private final PasswordEncoder passwordEncoder;
    private final OtpService otpService;
    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;
    private final AuthenticationManager authenticationManager;
    private final UserMapper userMapper;

    /** CHI true khi dev/test chua co SMTP that; production phai la false de khong lo OTP qua API. */
    @Value("${app.otp.expose-in-response:false}")
    private boolean exposeOtpInResponse;

    /**
     * B02 Buoc 1-2: cung cap thong tin co ban + ra soat trung lap
     */
    @Override
    @Transactional
    public UserResponse register(RegisterAccountRequest req) {
        if (req.getEmail() != null && userRepository.existsByEmail(req.getEmail())) {
            throw new BusinessException(AuthErrorCode.EMAIL_ALREADY_EXISTS);
        }
        if (req.getPhone() != null && userRepository.existsByPhone(req.getPhone())) {
            throw new BusinessException(AuthErrorCode.PHONE_ALREADY_EXISTS);
        }

        RoleUser requestedRole = req.getRole() != null ? req.getRole() : RoleUser.CUSTOMER;

        User user = userMapper.toEntyity(req);
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        Role role = roleRepository.findByName(requestedRole.name())
                .orElseThrow(() -> new BusinessException(AuthErrorCode.ROLE_NOT_FOUND));
        HashSet<UserRole> roles = new HashSet<>();
        roles.add(com.dabana.backend.modules.auth.entity.UserRole.builder().role(role).user(user).build());
        user.setUserRoles(roles);

        if (requestedRole == RoleUser.RESTAURANT_PARTNER) {
            user.setStatus(AccountStatus.PENDING_OTP.getStatus());
        } else {
            user.setStatus(AccountStatus.ACTIVE.getStatus());
        }
        user = userRepository.saveAndFlush(user);

        UserResponse userResponse = userMapper.userResponse(user);
        if (requestedRole == RoleUser.RESTAURANT_PARTNER) {
            String otp = otpService.generateAndSend(req.getEmail()); // B02 Buoc 3: gui OTP that qua email
            if (exposeOtpInResponse) {
                // Chi dung khi dev/test chua cau hinh SMTP that, de tien kiem tra luong ma khong can mo email.
                userResponse.setOtp(otp);
            }
        }

        return userResponse;
    }

    /**
     * Gui lai OTP khi ma cu het han hoac nguoi dung khong nhan duoc email (B02 buoc 3, truong hop gui lai).
     */
    @Override
    @Transactional
    public Boolean resendOtp(String identifier) {
        User user = userRepository.findByEmailOrPhone(identifier)
                .orElseThrow(() -> new BusinessException(AuthErrorCode.USER_NOT_FOUND));

        if (user.getStatus() != AccountStatus.PENDING_OTP.getStatus()) {
            // Tai khoan da xac thuc OTP roi hoac dang o trang thai khac, khong can gui lai.
            throw new BusinessException(AuthErrorCode.OTP_ALREADY_VERIFIED);
        }

        otpService.generateAndSend(identifier);
        return true;
    }

    /** B02 Buoc 3: Xac thuc OTP */
    @Override
    @Transactional
    public Boolean verifyOtp(VerifyOtpRequest req) {
        otpService.verify(req.getIdentifier(), req.getOtpCode());
        User user = userRepository.findByEmailOrPhone(req.getIdentifier())
                .orElseThrow(() -> new BusinessException(AuthErrorCode.USER_NOT_FOUND));

        boolean isPartner = user.getUserRoles().stream()
                .anyMatch(ur -> RoleUser.RESTAURANT_PARTNER.name().equals(ur.getRole().getName()));
        user.setStatus(isPartner
                ? AccountStatus.PENDING_ADMIN.getStatus()
                : AccountStatus.ACTIVE.getStatus());
        userRepository.save(user);
        return true;
    }

    /** B02 Buoc 4-5: Quan tri vien duyet/tu choi - xem AdminService */


    @Override
    @Transactional(readOnly = true)
    public UserResponse login(LoginRequest req) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        req.getIdentifier(),
                        req.getPassword())
        );
        CustomUserDetail principal =
                (CustomUserDetail) authentication.getPrincipal();

        User user = principal.getUser();
        // một số trạng thái được xử lí ở security
        if (user.getStatus() == AccountStatus.REJECTED.getStatus()) {
            throw new BusinessException(AuthErrorCode.ACCESS_DENIED);
        }
        if (user.getStatus() == AccountStatus.PENDING_ADMIN.getStatus()) {
            throw new BusinessException(AuthErrorCode.ACCOUNT_NOT_VERIFIED_BY_ADMIN);
        }

        String accessToken = jwtService.generateAccessToken(principal, user.getId(), user.getUserRoles().stream().toList());
        String refreshToken = jwtService.generateRefreshToken(principal, user.getId());
        UserResponse userResponse = userMapper.userResponse(user);
        userResponse.setAccessToken(accessToken);
        userResponse.setRefreshToken(refreshToken);
        return userResponse;
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse refresh(RefreshTokenRequest req) {
        String token = req.getRefreshToken();

        if (!"refresh".equals(jwtService.extractTokenType(token))) {
            throw new BusinessException(AuthErrorCode.REFRESH_TOKEN_INVALID);
        }

        Long userId = jwtService.extractUserId(token);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(AuthErrorCode.USER_NOT_FOUND));

        CustomUserDetail userDetails = new CustomUserDetail(user);
        if (!jwtService.isTokenValid(token, userDetails)) {
            throw new BusinessException(AuthErrorCode.REFRESH_TOKEN_EXPIRED);
        }

        if (user.getStatus() == AccountStatus.SUSPENDED.getStatus()
                || user.getStatus() == AccountStatus.REJECTED.getStatus()) {
            throw new BusinessException(AuthErrorCode.ACCESS_DENIED);
        }

        String newAccessToken = jwtService.generateAccessToken(userDetails, user.getId(), user.getUserRoles().stream().toList());

        UserResponse userResponse = userMapper.userResponse(user);
        userResponse.setAccessToken(newAccessToken);
        userResponse.setRefreshToken(token); // giu nguyen refresh token cu cho den khi het han
        return userResponse;
    }
}
