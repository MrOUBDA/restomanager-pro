package com.restomanager.restaurant_service.dto;

import jakarta.validation.constraints.*;
import java.time.LocalDateTime;
import java.util.UUID;

public record CreateReservationRequest(
    @NotBlank String customerName,
    @NotBlank String customerPhone,
    @Email String customerEmail,
    @NotNull @Min(1) Integer guestCount,
    @NotNull LocalDateTime reservationTime,
    UUID preferredTableId
) {}