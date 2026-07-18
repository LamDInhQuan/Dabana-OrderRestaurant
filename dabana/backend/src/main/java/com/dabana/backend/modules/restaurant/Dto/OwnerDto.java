package com.dabana.backend.modules.restaurant.Dto;

import jakarta.persistence.Column;
import lombok.Data;

@Data
public class OwnerDto {
    private Long id;

    private String fullName;

    private String email;
    private String phone;
    private String avatarUrl;

}
