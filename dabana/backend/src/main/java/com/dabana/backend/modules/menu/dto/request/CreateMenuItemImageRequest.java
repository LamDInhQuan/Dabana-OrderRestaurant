package com.dabana.backend.modules.menu.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateMenuItemImageRequest {
    @NotNull
    private Long itemId;

    @NotBlank
    @Size(max = 255)
    private String imageUrl;

    private Integer displayOrder = 0;
}