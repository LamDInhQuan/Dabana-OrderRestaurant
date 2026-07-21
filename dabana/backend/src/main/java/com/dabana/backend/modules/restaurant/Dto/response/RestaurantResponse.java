package com.dabana.backend.modules.restaurant.Dto.response;

import com.dabana.backend.modules.auth.entity.User;
import com.dabana.backend.modules.restaurant.ApprovalStatus;
import com.dabana.backend.modules.restaurant.Dto.OwnerDto;

import jakarta.persistence.Column;
import jakarta.persistence.Enumerated;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import lombok.Data;

@Data
public class RestaurantResponse {

    private OwnerDto owner; 

    private String restaurantName;

    private String logoUrl;


    private String description;

    private String website;
    private String email;
    private String phone;
    private String cuisineType;
  


}
