package com.dabana.backend.modules.menu.util;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = false)
public class MenuItemStatusConverter implements AttributeConverter<MenuItemStatus, Integer> {

    @Override
    public Integer convertToDatabaseColumn(MenuItemStatus attribute) {
        return attribute == null ? null : attribute.getCode();
    }

    @Override
    public MenuItemStatus convertToEntityAttribute(Integer dbData) {
        return MenuItemStatus.fromCode(dbData);
    }
}