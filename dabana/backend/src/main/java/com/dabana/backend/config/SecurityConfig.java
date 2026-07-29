package com.dabana.backend.config;

import com.dabana.backend.exception.CustomAuthenticationEntryPoint;
import com.dabana.backend.security.CustomUserDetailsService;
import com.dabana.backend.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.http.HttpMethod;
import org.springframework.web.cors.CorsConfigurationSource;

/**
 * Cau hinh bao mat: JWT stateless, phan quyen RBAC theo tung nhom endpoint
 * tuong ung voi B01-B15 (Khach hang / Nha hang doi tac / Quan tri vien).
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final CustomUserDetailsService userDetailsService;
    private final CorsConfigurationSource corsConfigurationSource;
    private final CustomAuthenticationEntryPoint customAuthenticationEntryPoint;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        provider.setHideUserNotFoundExceptions(false);
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/payment/**").permitAll()

                        // Tab Goi Mon (Task 5): endpoint STOMP/SockJS realtime. Handshake ban dau
                        // la vai request HTTP thuong (info/xhr...) truoc khi nang cap len WebSocket -
                        // trinh duyet KHONG gan duoc Bearer header vao day nhu axios, nen phai
                        // permitAll o day. Hien CHUA co kiem tra JWT o tang STOMP CONNECT
                        // (WebSocketConfig chua co configureClientInboundChannel) - moi nguoi biet
                        // duoc branchId deu subscribe doc du lieu ban/don hang cua chi nhanh do.
                        // Neu can sau nay: them ChannelInterceptor kiem tra token trong STOMP
                        // CONNECT header thay vi mo permitAll nay.
                        .requestMatchers("/ws/**").permitAll()

                        // /api/auth/**: dang ky, dang nhap, refresh token - cong khai (B02 buoc 1-3)
                        .requestMatchers("/api/auth/**").permitAll()

                        // B03/B04: quan ly ho so & chi nhanh - chi nha hang doi tac
                        // (phai khai bao TRUOC rule permitAll ben duoi, vi Spring Security
                        //  khop rule theo thu tu khai bao - rule dau tien khop se duoc ap dung)
                        .requestMatchers("/api/restaurants/me/**", "/api/branchs/me/**")
                        .hasRole("RESTAURANT_PARTNER")

                        // Module Subscription (thu phi nen tang): tu quan ly goi cua CHINH minh
                        .requestMatchers("/api/subscriptions/me/**").hasRole("RESTAURANT_PARTNER")
                        // Trang gia cong khai - khong can dang nhap
                        .requestMatchers(HttpMethod.GET, "/api/subscription-plans/**").permitAll()

                        // Tim kiem & xem nha hang/chi nhanh - cong khai (B01 buoc 1-2)
                        .requestMatchers(HttpMethod.GET, "/api/restaurants/**", "/api/branchs/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/menu-items/branch/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/reviews/branch/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/branchs/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/menu/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/branches/*/policies/active-policy", "/api/branchs/*/policies/active-policy").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/branches/available-slot/get-shifts/**", "/api/branchs/*/policies/active-policy").permitAll()

                        // B05/B06/B07: chinh sach, thuc don, so do ban - nha hang doi tac
                        .requestMatchers("/api/policies/**", "/api/menu-items/manage/**", "/api/tables/manage/**")
                        .hasRole("RESTAURANT_PARTNER")
                        .requestMatchers(HttpMethod.POST, "/api/menu/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/menu/**").permitAll()
                        .requestMatchers(HttpMethod.PUT, "/api/menu/**").permitAll()
                        .requestMatchers(HttpMethod.DELETE, "/api/menu/**").permitAll()
                        .requestMatchers(HttpMethod.PATCH, "/api/menu/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/zones/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/zones/**").permitAll()
                        .requestMatchers(HttpMethod.PUT, "/api/zones/**").permitAll()
                        .requestMatchers(HttpMethod.DELETE, "/api/zones/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/dining-tables/**").permitAll()
                        // .requestMatchers(HttpMethod.PATCH, "/api/zones/**").permitAll()

                        // B08: cap nhat trang thai ban (check-in/out) - nha hang doi tac
                        .requestMatchers("/api/tables/*/status", "/api/bookings/*/check-in",
                                "/api/bookings/*/check-out")
                        .hasAnyRole("RESTAURANT_PARTNER", "ADMIN")

                        // B01: dat ban - khach hang da dang nhapp
                        .requestMatchers("/api/bookings/**").permitAll()

                        // B10: hang cho
                        .requestMatchers("/api/waitlists/**").hasAnyRole("CUSTOMER", "RESTAURANT_PARTNER")

                        // B13: danh gia - khach hang
                        .requestMatchers("POST", "/api/reviews/**").hasAnyRole("CUSTOMER","RESTAURANT_PARTNER")

                        // B14: ho so & lich su ca nhan - khach hang
                        .requestMatchers("/api/customers/me/**").hasRole("CUSTOMER")

                        // B15: thong ke - nha hang doi tac (chi nhanh minh) & admin (toan nen tang)
                        .requestMatchers("/api/statistics/branch/**").hasRole("RESTAURANT_PARTNER")
                        .requestMatchers("/api/statistics/platform/**").hasRole("ADMIN")

                        // B02/B03/B04 phe duyet - chi admin
                                // 1. Đưa các endpoint categories cụ thể lên TRƯỚC
                                .requestMatchers("POST", "/api/admin/categories/**").hasAnyRole("CUSTOMER", "RESTAURANT_PARTNER", "ADMIN")
                                .requestMatchers("GET", "/api/admin/categories/**").hasAnyRole("CUSTOMER", "RESTAURANT_PARTNER", "ADMIN")

// 2. Các tính năng quản trị chung khác của admin nằm ở SAU
                                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .anyRequest().authenticated()
                )
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .exceptionHandling(execetion -> execetion.authenticationEntryPoint(customAuthenticationEntryPoint));

        return http.build();
    }
}