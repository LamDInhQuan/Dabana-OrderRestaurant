package com.dabana.backend.modules.branch2.dto;

import lombok.*;

import java.time.LocalTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class OperatingPeriod {

    private LocalTime startTime;

    private LocalTime endTime;

    private String description ;

    private Integer operatingHourId ;
}