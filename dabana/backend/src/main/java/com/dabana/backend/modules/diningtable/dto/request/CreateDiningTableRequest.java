package com.dabana.backend.modules.diningtable.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreateDiningTableRequest {

    @NotNull
    private Long zoneId;

    @NotBlank
    private String tableName;

    @NotNull @Min(1)
    private Integer capacity;

    @Min(0) @Max(100)
    private Integer positionX;

    @Min(0) @Max(100)
    private Integer positionY;

    // Khong bat buoc: neu FE khong gui, service se dung gia tri mac dinh
    // (DEFAULT_WIDTH / DEFAULT_HEIGHT / rotation = 0).
    @Min(20) @Max(500)
    private Integer width;

    @Min(20) @Max(500)
    private Integer height;

    @DecimalMin("0") @DecimalMax("359.99")
    private BigDecimal rotation;
}