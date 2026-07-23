package com.dabana.backend.modules.booking.convert;

import com.dabana.backend.modules.booking.dto.PolicySnapshotDto;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class PolicySnapshotConverter
        implements AttributeConverter<PolicySnapshotDto, String> {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public String convertToDatabaseColumn(PolicySnapshotDto attribute) {
        try {
            return attribute == null ? null : objectMapper.writeValueAsString(attribute);
        } catch (Exception e) {
            throw new IllegalArgumentException(e);
        }
    }

    @Override
    public PolicySnapshotDto convertToEntityAttribute(String dbData) {
        try {
            return dbData == null ? null : objectMapper.readValue(dbData, PolicySnapshotDto.class);
        } catch (Exception e) {
            throw new IllegalArgumentException(e);
        }
    }
}