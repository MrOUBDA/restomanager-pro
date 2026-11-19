package com.restomanager.restaurant_service.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record ProductResponse(
    UUID id,
    String name,
    String description,
    BigDecimal priceExclVat,
    BigDecimal vatRate,
    BigDecimal priceInclVat,
    Boolean isAvailable,
    UUID categoryId,
    String categoryName
) {}
