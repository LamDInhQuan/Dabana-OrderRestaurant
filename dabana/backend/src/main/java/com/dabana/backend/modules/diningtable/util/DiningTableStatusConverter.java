package com.dabana.backend.modules.diningtable.util;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = false)
public class DiningTableStatusConverter implements AttributeConverter<DiningTableStatus, Integer> {

    @Override
    public Integer convertToDatabaseColumn(DiningTableStatus attribute) {
        return attribute == null ? null : attribute.getCode();
    }

    @Override
    public DiningTableStatus convertToEntityAttribute(Integer dbData) {
        return DiningTableStatus.fromCode(dbData);
    }
}