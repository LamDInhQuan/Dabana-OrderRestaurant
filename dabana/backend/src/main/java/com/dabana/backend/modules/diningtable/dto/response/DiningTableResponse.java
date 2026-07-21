package com.dabana.backend.modules.diningtable.dto.response;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class DiningTableResponse {
    private Long id;
    private Long zoneId;
    private String zoneName;
    private String tableName;
    private Integer capacity;
    private Integer status;
    private Integer positionX;
    private Integer positionY;
    private Integer width;
    private Integer height;
    private BigDecimal rotation;
}