package com.dabana.backend.config;

import vn.payos.PayOS;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class PayOSConfig {

    // 🌟 Thay bằng 3 cái mã Key xịn trên Dashboard PayOS của Quân vào đây
    public static final String clientId = "d406da26-f9f7-43c8-9526-180c066516b9";
    public static final String apiKey = "73058281-674a-4880-82e2-6f415438026b";
    public static final String checksumKey = "be06aee42edc558562f21265dad20d823caeca150e2c45f66c929c2202724849";

    @Bean
    public PayOS payOS() {
        return new PayOS(clientId, apiKey, checksumKey);
    }
}