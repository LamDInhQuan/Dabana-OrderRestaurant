package com.dabana.backend.modules.booking.convert;

import com.dabana.backend.modules.booking.dto.PolicySnapshotDto;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = false)
public class PolicySnapshotConverter implements AttributeConverter<PolicySnapshotDto, String> {

    // 1. Đăng ký JavaTimeModule để Jackson hiểu kiểu LocalDateTime
    private static final ObjectMapper objectMapper = new ObjectMapper()
            .registerModule(new JavaTimeModule());

    @Override
    public String convertToDatabaseColumn(PolicySnapshotDto attribute) {
        if (attribute == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(attribute);
        } catch (JsonProcessingException e) {
            // 2. KHÔNG return null âm thầm nữa! In log lỗi rõ ràng và throw Exception để debug
//            log.error("Lỗi Convert PolicySnapshotDto sang JSON String: {}", e.getMessage(), e);
            throw new IllegalArgumentException("Không thể serialize PolicySnapshotDto sang JSON", e);
        }
    }

    @Override
    public PolicySnapshotDto convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.trim().isEmpty()) {
            return null;
        }
        try {
            return objectMapper.readValue(dbData, PolicySnapshotDto.class);
        } catch (JsonProcessingException e) {
//            log.error("Lỗi Deserialize JSON String sang PolicySnapshotDto: {}", e.getMessage(), e);
            return null; // Chiều đọc từ DB lên nếu lỗi thì để null để tránh crash ứng dụng khi đọc dữ liệu cũ
        }
    }
}