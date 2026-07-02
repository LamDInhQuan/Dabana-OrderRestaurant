package com.dabana.backend.security;

import com.dabana.backend.modules.auth.User;
import com.dabana.backend.modules.auth.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String identifier) throws UsernameNotFoundException {
        User user = userRepository.findByEmailOrPhone(identifier)
                .orElseThrow(() -> new UsernameNotFoundException("Khong tim thay nguoi dung: " + identifier));
        return toUserDetails(user);
    }

    public UserDetails toUserDetails(User user) {
        Collection<? extends GrantedAuthority> authorities =
                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));

        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail() != null ? user.getEmail() : user.getPhone())
                .password(user.getPassword())
                .authorities(authorities)
                .build();
    }
}
