package com.restomanager.restaurant_service.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.UUID;

public record CreateProductRequest(
    @NotBlank(message = "Le nom est obligatoire") String name,
    String description,
    @NotNull @DecimalMin("0.01") BigDecimal priceExclVat,
    @NotNull @DecimalMin("0.00") BigDecimal vatRate,
    @NotNull UUID categoryId
) {}