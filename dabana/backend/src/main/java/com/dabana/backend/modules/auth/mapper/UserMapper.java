package com.dabana.backend.modules.auth.mapper;

import com.dabana.backend.modules.auth.dto.request.RegisterRequest;
import com.dabana.backend.modules.auth.dto.response.UserResponse;
import com.dabana.backend.modules.auth.entity.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {
    public User toEntyity(RegisterRequest request) {
        User user = new User();
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setPassword(request.getPassword());
        return user;
    }

    public UserResponse userResponse(User user) {
        return UserResponse.builder()
                .phone(user.getPhone())
                .email(user.getEmail())
                .id(user.getId())
                .fullName(user.getFullName())
                .avatarUrl(user.getAvatarUrl())
                .status(user.getStatus())
                .role(user.getRole().getName())
                .build();
    }
}
