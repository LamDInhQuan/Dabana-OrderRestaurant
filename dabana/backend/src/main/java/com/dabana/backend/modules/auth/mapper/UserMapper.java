package com.dabana.backend.modules.auth.mapper;

import com.dabana.backend.modules.auth.dto.request.RegisterAccountRequest;
import com.dabana.backend.modules.auth.dto.response.UserResponse;
import com.dabana.backend.modules.auth.entity.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {
    public User toEntyity(RegisterAccountRequest request) {
        User user = new User();
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setPassword(request.getPassword());
        return user;
    }

    public UserResponse userResponse(User user) {
        String role = user.getUserRoles().stream()
                .findFirst()
                .map(ur -> ur.getRole().getName())
                .orElse(null);

        return UserResponse.builder()
                .phone(user.getPhone())
                .email(user.getEmail())
                .id(user.getId())
                .fullName(user.getFullName())
                .avatarUrl(user.getAvatarUrl())
                .status(user.getStatus())
                .role(role)
                .build();
    }
}
