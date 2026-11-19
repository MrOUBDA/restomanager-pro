package com.restomanager.order_service.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record OrderItemResponse(
    UUID id,
    UUID productId,
    String productName,
    BigDecimal unitPriceExclVat,
    BigDecimal vatRate,
    Integer quantity,
    String notes,
    BigDecimal lineTotalInclVat
) {}