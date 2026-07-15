package com.dabana.backend.modules.restaurant.Dto;

import com.dabana.backend.modules.auth.entity.User;
import com.dabana.backend.modules.restaurant.ApprovalStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Enumerated;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import lombok.Data;

@Data
public class RestaurantResponse {

    private OwnerDto owner; 

    private String brandName;

    private String logoUrl;


    private String description;


    private String cuisineType; 


}
