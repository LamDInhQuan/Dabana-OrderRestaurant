package com.dabana.backend.modules.restaurant.Dto.report;

import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonIgnore;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DetailExcelReport {
    private Long dailyServing;
    private Long dailyBooked;
    private LocalDate reportedDate;
    private Double fillrate;
    private Double revenue;
    
    private Long noShow;

    private Long finished;
    
    public String getNoShowRate() {
        return finished.toString() + '/' + noShow.toString();
    }
}
