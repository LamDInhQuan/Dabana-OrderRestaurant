package com.dabana.backend.config;

import vn.payos.PayOS;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class PayOSConfig {

    // 🌟 Thay bằng 3 cái mã Key xịn trên Dashboard PayOS của Quân vào đây
    public static final String clientId = "089a788e-9d19-4256-80a5-4fe3f5b0b34c";
    public static final String apiKey = "32251abf-b037-43b9-a862-c1c78b514858";
    public static final String checksumKey = "a89897c4834e79872e853ec1bf97e2502cd53322983c7fb1392148d5b10eb0d3";

    @Bean
    public PayOS payOS() {
        return new PayOS(clientId, apiKey, checksumKey);
    }
}