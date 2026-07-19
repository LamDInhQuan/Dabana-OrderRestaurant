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
                // /api/auth/**: dang ky, dang nhap, refresh token - cong khai (B02 buoc 1-3)
                .requestMatchers("/api/auth/**").permitAll()

                // B03/B04: quan ly ho so & chi nhanh - chi nha hang doi tac
                // (phai khai bao TRUOC rule permitAll ben duoi, vi Spring Security
                //  khop rule theo thu tu khai bao - rule dau tien khop se duoc ap dung)
                .requestMatchers("/api/restaurants/me/**", "/api/branchs/me/**")
                    .hasRole("RESTAURANT_PARTNER")

                // Tim kiem & xem nha hang/chi nhanh - cong khai (B01 buoc 1-2)
                .requestMatchers("GET", "/api/restaurants/**", "/api/branchs/**").permitAll()
                .requestMatchers("GET", "/api/menu-items/branch/**").permitAll()
                .requestMatchers("GET", "/api/reviews/branch/**").permitAll()

                // B05/B06/B07: chinh sach, thuc don, so do ban - nha hang doi tac
                    .requestMatchers(HttpMethod.GET, "/api/zones/**").hasAnyRole("CUSTOMER", "STAFF", "RESTAURANT_PARTNER")
                .requestMatchers("/api/policies/**", "/api/menu-items/manage/**",
                                  "/api/zones/**", "/api/tables/manage/**")
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
                // .requestMatchers(HttpMethod.PATCH, "/api/zones/**").permitAll()

                // B08: cap nhat trang thai ban (check-in/out) - nha hang doi tac
                .requestMatchers("/api/tables/*/status", "/api/bookings/*/check-in",
                                  "/api/bookings/*/check-out")
                    .hasAnyRole("RESTAURANT_PARTNER", "ADMIN")

                // B01: dat ban - khach hang da dang nhap
                .requestMatchers("/api/bookings/**").hasAnyRole("CUSTOMER", "RESTAURANT_PARTNER", "ADMIN")

                // B10: hang cho
                .requestMatchers("/api/waitlists/**").hasAnyRole("CUSTOMER", "RESTAURANT_PARTNER")

                // B13: danh gia - khach hang
                .requestMatchers("POST", "/api/reviews/**").hasRole("CUSTOMER")

                // B14: ho so & lich su ca nhan - khach hang
                .requestMatchers("/api/customers/me/**").hasRole("CUSTOMER")

                // B15: thong ke - nha hang doi tac (chi nhanh minh) & admin (toan nen tang)
                .requestMatchers("/api/statistics/branch/**").hasRole("RESTAURANT_PARTNER")
                .requestMatchers("/api/statistics/platform/**").hasRole("ADMIN")

                // B02/B03/B04 phe duyet - chi admin
                .requestMatchers("/api/admin/**").hasRole("ADMIN")

                .anyRequest().authenticated()
            )
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .exceptionHandling(execetion -> execetion.authenticationEntryPoint(customAuthenticationEntryPoint));

        return http.build();
    }
}
