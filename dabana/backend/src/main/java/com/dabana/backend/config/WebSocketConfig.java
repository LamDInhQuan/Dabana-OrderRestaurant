package com.dabana.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * WebSocket cho B08 Buoc 5: dong bo trang thai ban theo thoi gian thuc
 * tren so do nha hang (va cho khach xem chon ban - B01 buoc 3).
 *
 * Frontend dang ky: stompClient.subscribe('/topic/table-status/{branchId}', ...)
 * Backend phat: messagingTemplate.convertAndSend('/topic/table-status/{branchId}', payload)
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic"); // in-memory broker; production: dung RabbitMQ/ActiveMQ
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS(); // fallback cho trinh duyet khong ho tro WebSocket
    }
}
