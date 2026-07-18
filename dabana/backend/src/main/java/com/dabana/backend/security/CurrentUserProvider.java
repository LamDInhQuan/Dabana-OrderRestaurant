package com.dabana.backend.security;

import com.dabana.backend.modules.auth.entity.User;
import com.dabana.backend.modules.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CurrentUserProvider {

    private final UserRepository userRepository;

    public Long getCurrentUserId() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalStateException("Khong tim thay nguoi dung hien tai");
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof CustomUserDetail customUserDetail) {
            return customUserDetail.getUserId();
        }

        if (principal instanceof UserDetails userDetails) {
            User user = userRepository.findByEmailOrPhone(userDetails.getUsername())
                    .orElseThrow(() -> new IllegalStateException("Khong tim thay nguoi dung hien tai"));
            return user.getId();
        }

        throw new IllegalStateException("Khong tim thay nguoi dung hien tai");
    }
}
