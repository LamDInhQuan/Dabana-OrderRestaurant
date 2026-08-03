package com.dabana.backend.modules.restaurant.Dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RestaurantLicensesDto {
    private Long id;
    private String url;
    private String fileName;
    private String fileType;

    private Long RestaurantId;

}
