package com.dabana.backend.modules.diningtable.dto.response;

import lombok.Builder;
import lombok.Data;


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
}