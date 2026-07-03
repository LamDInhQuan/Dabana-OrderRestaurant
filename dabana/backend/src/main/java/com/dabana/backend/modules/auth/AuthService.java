package com.dabana.backend.modules.auth;

import com.dabana.backend.exception.BusinessException;
import com.dabana.backend.modules.auth.dto.AuthDtos.*;
import com.dabana.backend.security.CustomUserDetailsService;
import com.dabana.backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Trien khai dac ta B02: Dang ky va tro thanh nha hang doi tac
 * (va dang ky khach hang thong thuong dung chung quy trinh don gian hoa).
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final OtpService otpService;
    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;
    private final AuthenticationManager authenticationManager;

    /** B02 Buoc 1-2: cung cap thong tin co ban + ra soat trung lap */
    @Transactional
    public String register(RegisterRequest req) {
        if (req.getEmail() != null && userRepository.existsByEmail(req.getEmail())) {
            throw new BusinessException("EMAIL_EXISTS", "Email da duoc su dung (EF03)");
        }
        if (req.getPhone() != null && userRepository.existsByPhone(req.getPhone())) {
            throw new BusinessException("PHONE_EXISTS", "So dien thoai da duoc su dung (EF03)");
        }

        User user = new User();
        user.setFullName(req.getFullName());
        user.setEmail(req.getEmail());
        user.setPhone(req.getPhone());
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        Role role = new Role();
        role.setId(1);
        user.setRole(role);
        // Khach hang thi kich hoat ngay; doi tac can qua OTP + admin duyet (B02)
        user.setStatus(1);
        try {

            userRepository.save(user);

        } catch (Exception e) {

            e.printStackTrace();

        }
//        if (req.getRole() != UserRole.CUSTOMER) {
//            String identifier = req.getEmail() != null ? req.getEmail() : req.getPhone();
//            otpService.generateAndSend(identifier); // B02 Buoc 3
//        }

        return "Dang ky thanh cong";
    }

    /** B02 Buoc 3: Xac thuc OTP */
    @Transactional
    public String verifyOtp(VerifyOtpRequest req) {
        otpService.verify(req.getIdentifier(), req.getOtpCode());

        User user = userRepository.findByEmailOrPhone(req.getIdentifier())
                .orElseThrow(() -> new BusinessException("USER_NOT_FOUND", "Khong tim thay tai khoan"));

//        user.setOtpVerified(true);
        user.setStatus(1); // B02 Buoc 4: cho admin duyet
        userRepository.save(user);

        return "Xac thuc OTP thanh cong. Tai khoan dang cho quan tri vien duyet.";
    }

    /** B02 Buoc 4-5: Quan tri vien duyet/tu choi - xem AdminService */

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest req) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.getIdentifier(), req.getPassword()));

        User user = userRepository.findByEmailOrPhone(req.getIdentifier())
                .orElseThrow(() -> new BusinessException("USER_NOT_FOUND", "Khong tim thay tai khoan"));

//        if (user.getStatus() == AccountStatus.REJECTED) {
//            throw new BusinessException("ACCOUNT_REJECTED",
//                    "Tai khoan bi tu choi: " + user.getRejectionReason());
//        }
//        if (user.getStatus() == AccountStatus.PENDING_OTP) {
//            throw new BusinessException("ACCOUNT_PENDING_OTP", "Tai khoan chua xac thuc OTP");
//        }
//        if (user.getStatus() == AccountStatus.PENDING_ADMIN) {
//            throw new BusinessException("ACCOUNT_PENDING_ADMIN", "Tai khoan dang cho quan tri vien duyet");
//        }
//        if (user.getStatus() == AccountStatus.SUSPENDED) {
//            throw new BusinessException("ACCOUNT_SUSPENDED", "Tai khoan da bi khoa");
//        }

        UserDetails userDetails = userDetailsService.toUserDetails(user);
        String accessToken = jwtService.generateAccessToken(userDetails, user.getId(), user.getRole().getRoleName());
        String refreshToken = jwtService.generateRefreshToken(userDetails, user.getId());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .userId(user.getId())
                .fullName(user.getFullName())
                .role(user.getRole().getRoleName())
//                .status(user.getStatus().name())
                .build();
    }

    @Transactional(readOnly = true)
    public AuthResponse refresh(RefreshTokenRequest req) {
        String token = req.getRefreshToken();
        if (!"refresh".equals(jwtService.extractTokenType(token))) {
            throw new BusinessException("INVALID_TOKEN", "Token khong hop le");
        }
        String username = jwtService.extractUsername(token);
        User user = userRepository.findByEmailOrPhone(username)
                .orElseThrow(() -> new BusinessException("USER_NOT_FOUND", "Khong tim thay tai khoan"));

        UserDetails userDetails = userDetailsService.toUserDetails(user);
        if (!jwtService.isTokenValid(token, userDetails)) {
            throw new BusinessException("TOKEN_EXPIRED", "Refresh token het han, vui long dang nhap lai");
        }

        String newAccessToken = jwtService.generateAccessToken(userDetails, user.getId(), user.getRole().getRoleName());
        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(token)
                .userId(user.getId())
                .fullName(user.getFullName())
                .role(user.getRole().getRoleName())
//                .status(user.getStatus().name())
                .build();
    }
}
