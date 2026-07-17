package com.dabana.backend.modules.branch2.util;

import com.dabana.backend.common.ErrorDetail;
import lombok.Getter;
import lombok.experimental.SuperBuilder;

@Getter
@SuperBuilder
public class OperatingHourErrorDetail extends ErrorDetail {
    private String dayOfWeek ;
}
