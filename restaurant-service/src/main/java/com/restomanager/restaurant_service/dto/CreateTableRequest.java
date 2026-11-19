package com.restomanager.restaurant_service.dto;

import jakarta.validation.constraints.*;

public record CreateTableRequest(
    @NotNull @Min(1) Integer tableNumber,
    @NotNull @Min(1) Integer capacity,
    @NotBlank String zone
) {}