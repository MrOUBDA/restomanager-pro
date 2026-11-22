package com.restomanager.restaurant_service.dto;

import jakarta.validation.constraints.*;

public record UpdateTablePositionRequest(
    @NotNull @Min(0) @Max(95) Integer posX,
    @NotNull @Min(0) @Max(90) Integer posY
) {}