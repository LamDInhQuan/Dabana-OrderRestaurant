package com.dabana.backend.modules.restaurant.Dto.response;

import java.util.List;

import com.dabana.backend.modules.restaurant.Dto.RestaurantLicensesDto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RestaurantAndLicenseResponse {
    private RestaurantResponse restaurant;
    private List<RestaurantLicensesDto> licenses;
}
