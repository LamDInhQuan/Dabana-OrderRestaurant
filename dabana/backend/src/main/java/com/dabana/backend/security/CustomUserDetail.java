package com.dabana.backend.security;

import com.dabana.backend.modules.auth.entity.User;
import com.dabana.backend.modules.auth.util.AccountStatus;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;

public class CustomUserDetail implements UserDetails {
    private User user ;

    public CustomUserDetail(User user) {
        this.user = user;
    }

    public User getUser() {
        return user;
    }


    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return this.user.getUserRoles().stream().
                map(role -> new SimpleGrantedAuthority("ROLE_" + role.getRole().getName()))
                .toList();
    }

    @Override
    public String getPassword() {
        return this.user.getPassword();
    }

    @Override
    public String getUsername() {
        return this.user.getEmail() != null ? this.user.getEmail() : this.user.getPhone();
    }

    public Long getUserId() {
        return this.user.getId();
    }

    @Override
    public boolean isAccountNonLocked() {
        return this.user.getStatus() != AccountStatus.SUSPENDED.getStatus();
    }

    @Override
    public boolean isEnabled() {
        return this.user.getStatus() != AccountStatus.PENDING_OTP.getStatus();
    }
}
