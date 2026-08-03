package com.dabana.backend.modules.auth.service;

import com.dabana.backend.exception.BusinessException;
//import com.dabana.backend.modules.auth.OtpService;
import com.dabana.backend.modules.auth.service.OtpService;
import com.dabana.backend.modules.auth.dto.request.ChangePasswordRequest;
import com.dabana.backend.modules.auth.dto.request.ForgotPasswordRequest;
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
import com.dabana.backend.modules.auth.util.OtpPurpose;
import com.dabana.backend.modules.auth.util.RoleUser;
import com.dabana.backend.modules.restaurant.ApprovalStatus;
import com.dabana.backend.modules.restaurant.Dto.request.RestaurantRegisterRequest;
import com.dabana.backend.modules.restaurant.entity.Restaurant;
import com.dabana.backend.modules.restaurant.mapper.RestaurantMapper;
import com.dabana.backend.modules.restaurant.repository.RestaurantRepository;
import com.dabana.backend.modules.restaurant.service.RestaurantService;
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
import org.springframework.web.multipart.MultipartFile;

import java.security.SecureRandom;
import java.util.HashSet;
import java.util.List;

/**
 * Trien khai dac ta B02: Dang ky va tro thanh nha hang doi tac
 * (va dang ky khach hang thong thuong dung chung quy trinh don gian hoa).
 */
@Service
@RequiredArgsConstructor
public class AuthService implements IAuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final PasswordEncoder passwordEncoder;
    private final OtpService otpService;
    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;
    private final AuthenticationManager authenticationManager;
    private final UserMapper userMapper;
    private final MailService mailService;
    private final RestaurantRepository restaurantRepository;
    private final RestaurantMapper restaurantMapper;
    private final RestaurantService restaurantService;

    private static final String PASSWORD_CHARS =
            "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    /**
     * CHI true khi dev/test chua co SMTP that; production phai la false de khong lo OTP qua API.
     */
    @Value("${app.otp.expose-in-response:false}")
    private boolean exposeOtpInResponse;

    /**
     * B02 Buoc 1-2: cung cap thong tin co ban + ra soat trung lap
     */
    @Override
    @Transactional
    public UserResponse registerCustomer(RegisterAccountRequest req) {
        if (req.getEmail() != null && userRepository.existsByEmail(req.getEmail())) {
            throw new BusinessException(AuthErrorCode.EMAIL_ALREADY_EXISTS);
        }
        if (req.getPhone() != null && userRepository.existsByPhone(req.getPhone())) {
            throw new BusinessException(AuthErrorCode.PHONE_ALREADY_EXISTS);
        }

        User user = userMapper.toEntyity(req);
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        Role role = roleRepository.findByName(RoleUser.CUSTOMER.name())
                .orElseThrow(() -> new BusinessException(AuthErrorCode.ROLE_NOT_FOUND));
        HashSet<UserRole> roles = new HashSet<>();
        roles.add(com.dabana.backend.modules.auth.entity.UserRole.builder().role(role).user(user).build());
        user.setUserRoles(roles);

        user.setStatus(AccountStatus.ACTIVE.getStatus());
        user = userRepository.saveAndFlush(user);

        return userMapper.userResponse(user);
    }

    @Override
    @Transactional
    public UserResponse registerPartner(RegisterAccountRequest req, RestaurantRegisterRequest restaurantReq, List<MultipartFile> licenses) {
        if (restaurantReq.getRestaurantName() == null || restaurantReq.getRestaurantName().trim().isEmpty()) {
            throw new BusinessException(AuthErrorCode.RESTAURANT_NAME_REQUIRED);
        }
        if (restaurantReq.getRestaurantPhone() == null || restaurantReq.getRestaurantPhone().trim().isEmpty()) {
            throw new BusinessException(AuthErrorCode.RESTAURANT_PHONE_REQUIRED);
        }
        if (req.getEmail() != null && userRepository.existsByEmail(req.getEmail())) {
            throw new BusinessException(AuthErrorCode.EMAIL_ALREADY_EXISTS);
        }
        if (req.getPhone() != null && userRepository.existsByPhone(req.getPhone())) {
            throw new BusinessException(AuthErrorCode.PHONE_ALREADY_EXISTS);
        }

        User user = userMapper.toEntyity(req);
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        Role role = roleRepository.findByName(RoleUser.RESTAURANT_PARTNER.name())
                .orElseThrow(() -> new BusinessException(AuthErrorCode.ROLE_NOT_FOUND));
        HashSet<UserRole> roles = new HashSet<>();
        roles.add(com.dabana.backend.modules.auth.entity.UserRole.builder().role(role).user(user).build());
        user.setUserRoles(roles);

        user.setStatus(AccountStatus.PENDING_OTP.getStatus());
        user = userRepository.saveAndFlush(user);

        // === TẠ BẢN GHI NHÀ HÀNG NẾU LÀ RESTAURANT_PARTNER ===
        Restaurant restaurant = restaurantMapper.toEntity(restaurantReq);
        restaurant.setOwner(user); // Gắn khóa ngoại liên kết với User vừa tạo
        restaurant.setApprovalStatus(ApprovalStatus.PENDING); // Trạng thái chờ admin duyệt nhà hàng

        restaurantRepository.saveAndFlush(restaurant);

        // === UPLOAD LICENSES TRONG CÙNG TRANSACTION - nếu lỗi sẽ rollback user và restaurant ===
        restaurantService.uploadLicenses(user.getId(), licenses);

        UserResponse userResponse = userMapper.userResponse(user);
        // String otp = otpService.generateAndSend(req.getEmail(), OtpPurpose.REGISTER); // B02 Buoc 3: gui OTP that qua email
        // if (exposeOtpInResponse) {
        //     // Chi dung khi dev/test chua cau hinh SMTP that, de tien kiem tra luong ma khong can mo email.
        //     userResponse.setOtp(otp);
        // }

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
        otpService.generateAndSend(identifier, OtpPurpose.REGISTER);
        return true;
    }

    /**
     * B02 Buoc 3: Xac thuc OTP
     */
    @Override
    @Transactional
    public Boolean verifyOtp(VerifyOtpRequest req) {
        otpService.verify(req.getIdentifier(), req.getOtpCode(), OtpPurpose.REGISTER);
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

    /**
     * B02 Buoc 4-5: Quan tri vien duyet/tu choi - xem AdminService
     */


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

    /**
     * Quen mat khau: nguoi dung nhap email da dang ky, he thong sinh mat khau
     * moi ngau nhien, ma hoa va luu lai, roi gui mat khau moi ve email do.
     */
    @Override
    @Transactional
    public Boolean forgotPassword(ForgotPasswordRequest req) {
        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new BusinessException(AuthErrorCode.USER_NOT_FOUND));

        String newPassword = generateRandomPassword(10);
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        mailService.sendNewPasswordEmail(user.getEmail(), newPassword);
        return true;
    }

    /**
     * Doi mat khau: nguoi dung da dang nhap nhap mat khau hien tai de xac thuc,
     * sau do xac nhan mat khau moi truoc khi luu.
     */
    @Override
    @Transactional
    public Boolean changePassword(Long userId, ChangePasswordRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(AuthErrorCode.USER_NOT_FOUND));

        if (!passwordEncoder.matches(req.getOldPassword(), user.getPassword())) {
            throw new BusinessException(AuthErrorCode.PASSWORD_INCORRECT);
        }

        if (!req.getNewPassword().equals(req.getConfirmPassword())) {
            throw new BusinessException(AuthErrorCode.PASSWORD_CONFIRM_NOT_MATCH);
        }

        if (passwordEncoder.matches(req.getNewPassword(), user.getPassword())) {
            throw new BusinessException(AuthErrorCode.NEW_PASSWORD_SAME_AS_OLD);
        }

        user.setPassword(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(user);
        return true;
    }

    private String generateRandomPassword(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(PASSWORD_CHARS.charAt(RANDOM.nextInt(PASSWORD_CHARS.length())));
        }
        return sb.toString();
    }
}
