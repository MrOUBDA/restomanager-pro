package com.restomanager.restaurant_service.dto;

import com.restomanager.restaurant_service.entity.ReservationStatus;
import java.time.LocalDateTime;
import java.util.UUID;

public record ReservationResponse(
    UUID id,
    String customerName,
    String customerPhone,
    String customerEmail,
    Integer guestCount,
    LocalDateTime reservationTime,
    ReservationStatus status,
    Boolean isDelayed,
    UUID tableId,
    Integer tableNumber,
    String zone
) {}