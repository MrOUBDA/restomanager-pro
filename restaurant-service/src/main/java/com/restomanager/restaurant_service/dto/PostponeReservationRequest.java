package com.restomanager.restaurant_service.dto;

import jakarta.validation.constraints.*;
import java.time.LocalDateTime;

public record PostponeReservationRequest(
    @NotNull LocalDateTime newReservationTime
) {}