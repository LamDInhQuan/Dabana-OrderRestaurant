package com.dabana.backend.modules.auth.service;

import com.dabana.backend.exception.BusinessException;
//import com.dabana.backend.modules.auth.OtpService;
import com.dabana.backend.modules.auth.service.OtpService;
import com.dabana.backend.modules.auth.dto.request.LoginRequest;
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

        User user = userMapper.toEntyity(req);
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        Role role = roleRepository.findByName(RoleUser.CUSTOMER.name()).orElseThrow(() -> new BusinessException(AuthErrorCode.ROLE_NOT_FOUND));
        HashSet<UserRole> roles = new HashSet<>();
        roles.add(com.dabana.backend.modules.auth.entity.UserRole.builder().role(role).user(user).build());
        user.setUserRoles(roles);
        userRepository.save(user);
        String otp = otpService.generateAndSend(req.getEmail()); // B02 Buoc 3
        UserResponse userResponse = userMapper.userResponse(user);
        userResponse.setOtp(otp);
        return userResponse ;
    }

    /** B02 Buoc 3: Xac thuc OTP */
    @Override
    @Transactional
    public Boolean verifyOtp(VerifyOtpRequest req) {
        otpService.verify(req.getIdentifier(), req.getOtpCode());
        User user = userRepository.findByEmailOrPhone(req.getIdentifier())
                .orElseThrow(() -> new BusinessException(AuthErrorCode.USER_NOT_FOUND));
        user.setStatus(AccountStatus.ACTIVE.getStatus());  // active khi set otp thành công
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

//    @Transactional(readOnly = true)
//    public AuthResponse refresh(RefreshTokenRequest req) {
//        String token = req.getRefreshToken();
//        if (!"refresh".equals(jwtService.extractTokenType(token))) {
//            throw new BusinessException("INVALID_TOKEN", "Token khong hop le");
//        }
//        String username = jwtService.extractUsername(token);
//        User user = userRepository.findByEmailOrPhone(username)
//                .orElseThrow(() -> new BusinessException("USER_NOT_FOUND", "Khong tim thay tai khoan"));
//
//        UserDetails userDetails = userDetailsService.toUserDetails(user);
//        if (!jwtService.isTokenValid(token, userDetails)) {
//            throw new BusinessException("TOKEN_EXPIRED", "Refresh token het han, vui long dang nhap lai");
//        }
//
//        String newAccessToken = jwtService.generateAccessToken(userDetails, user.getId(), user.getRole().getRoleName());
//        return AuthResponse.builder()
//                .accessToken(newAccessToken)
//                .refreshToken(token)
//                .userId(user.getId())
//                .fullName(user.getFullName())
//                .role(user.getRole().getRoleName())
////                .status(user.getStatus().name())
//                .build();
//    }
}
