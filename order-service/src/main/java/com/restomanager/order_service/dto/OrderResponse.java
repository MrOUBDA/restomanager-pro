package com.restomanager.order_service.dto;

import com.restomanager.order_service.entity.OrderStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record OrderResponse(
    UUID id,
    UUID tableId,
    Integer tableNumber,
    OrderStatus status,
    BigDecimal discountAmount,
    BigDecimal totalExclVat,
    BigDecimal totalInclVat,
    LocalDateTime createdAt,
    LocalDateTime closedAt,
    List<OrderItemResponse> items
) {}