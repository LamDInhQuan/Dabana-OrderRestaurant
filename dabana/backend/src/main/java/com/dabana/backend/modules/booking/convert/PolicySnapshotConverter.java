package com.dabana.backend.modules.booking.convert;

import com.dabana.backend.modules.booking.dto.PolicySnapshotDto;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = false)
public class PolicySnapshotConverter
        implements AttributeConverter<PolicySnapshotDto, String> {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public String convertToDatabaseColumn(PolicySnapshotDto attribute) {
        if (attribute == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(attribute);
        } catch (Exception e) {
            return null;
        }
    }

    @Override
    public PolicySnapshotDto convertToEntityAttribute(String dbData) {
        // 💡 BẮT LỖI AN TOÀN: Nếu dbData null hoặc empty string thì trả về null ngay
        if (dbData == null || dbData.trim().isEmpty()) {
            return null;
        }
        try {
            return objectMapper.readValue(dbData, PolicySnapshotDto.class);
        } catch (Exception e) {
            // Log warning hoặc return null thay vì crash query
            return null;
        }
    }
}