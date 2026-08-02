package com.dabana.backend.modules.branch2.validation;

import com.dabana.backend.modules.branch2.dto.OperatingHourDto;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import jakarta.validation.Payload;

import java.lang.annotation.Annotation;

public class OperatingHourValidator implements ConstraintValidator<ValidOperatingHour, OperatingHourDto> {

    private String errorMessage;

    @Override
    public boolean isValid(OperatingHourDto value, ConstraintValidatorContext context) {
        if (value == null || value.getOpenTime() == null || value.getCloseTime() == null) {
            return true; // dành cho anotation not null kiểm tra
        }
        if (!value.getOpenTime().isBefore(value.getCloseTime())) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate(errorMessage)
                    .addPropertyNode("closeTime")
                    .addConstraintViolation();
            return false;
        }
        return true ;
    }

    @Override
    public void initialize(ValidOperatingHour constraintAnnotation) {
        ConstraintValidator.super.initialize(constraintAnnotation);
        this.errorMessage = constraintAnnotation.message();
    }
}
