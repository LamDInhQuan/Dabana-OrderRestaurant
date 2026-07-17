package com.dabana.backend.modules.branch2.validation;

import com.dabana.backend.modules.branch2.dto.OperatingHourDto;
import com.dabana.backend.modules.branch2.dto.request.BranchScheduleExceptionRequest;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class OperatingDateValidator implements ConstraintValidator<ValidOperatingDate, BranchScheduleExceptionRequest> {

    private String errorMessage;

    @Override
    public boolean isValid(BranchScheduleExceptionRequest value, ConstraintValidatorContext context) {
        if (value == null || value.getOpenTime() == null || value.getCloseTime() == null) {
            return true; // dành cho anotation not null kiểm tra
        }
        if (value.getStartDate().isAfter(value.getEndDate())) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate(errorMessage)
                    .addPropertyNode("endDate")
                    .addConstraintViolation();
            return false;
        }
        return true ;
    }

    @Override
    public void initialize(ValidOperatingDate constraintAnnotation) {
        ConstraintValidator.super.initialize(constraintAnnotation);
        this.errorMessage = constraintAnnotation.message();
    }
}
