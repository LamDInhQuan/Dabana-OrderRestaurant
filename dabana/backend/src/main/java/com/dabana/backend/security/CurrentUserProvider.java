package com.dabana.backend.security;

import com.dabana.backend.modules.auth.User;
import com.dabana.backend.modules.auth.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CurrentUserProvider {

    private final UserRepository userRepository;

    public Long getCurrentUserId() {
        UserDetails principal = (UserDetails) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        User user = userRepository.findByEmailOrPhone(principal.getUsername())
                .orElseThrow(() -> new IllegalStateException("Khong tim thay nguoi dung hien tai"));
        return user.getId();
    }
}
