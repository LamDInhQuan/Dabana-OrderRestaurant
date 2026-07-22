package com.dabana.backend.modules.orderboard.dto.response;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class ZoneBoardResponse {
    private Long zoneId;
    private String zoneName;
    private String description;
    private List<TableBoardResponse> tables = new ArrayList<>();
}
