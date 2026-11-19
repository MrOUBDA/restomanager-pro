package com.restomanager.order_service.dto;

import jakarta.validation.constraints.*;
import java.util.UUID;

public record OrderItemRequest(
    @NotNull UUID productId,
    @NotNull @Min(1) Integer quantity,
    String notes
) {}