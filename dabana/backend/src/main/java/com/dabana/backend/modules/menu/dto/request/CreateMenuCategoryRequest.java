package com.dabana.backend.modules.menu.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateMenuCategoryRequest {
    @NotNull
    private Long branchId;

    @NotBlank
    @Size(max = 100)
    private String categoryName;

    private Integer displayOrder = 0;
}