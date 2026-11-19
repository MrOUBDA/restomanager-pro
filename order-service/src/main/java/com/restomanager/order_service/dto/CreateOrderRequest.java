package com.restomanager.order_service.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record CreateOrderRequest(
    @NotNull UUID tableId,
    UUID waiterId,
    @DecimalMin("0.00") BigDecimal discountAmount,
    Boolean directService,
    @NotEmpty @Valid List<OrderItemRequest> items
) {}