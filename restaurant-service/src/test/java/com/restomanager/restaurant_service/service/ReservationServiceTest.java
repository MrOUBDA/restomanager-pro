package com.restomanager.restaurant_service.service;

import com.restomanager.restaurant_service.dto.CreateReservationRequest;
import com.restomanager.restaurant_service.entity.TableResto;
import com.restomanager.restaurant_service.repository.ReservationRepository;
import com.restomanager.restaurant_service.repository.TableRestoRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReservationServiceTest {

    @Mock
    private TableRestoRepository tableRepository;

    @Mock
    private ReservationRepository reservationRepository;

    @InjectMocks
    private ReservationService reservationService;

    @Test
    void createReservation_shouldRejectWhenTableAlreadyBookedOnWindow() {
        UUID tableId = UUID.randomUUID();
        TableResto table = TableResto.builder()
                .id(tableId).tableNumber(3).capacity(4).zone("Salle principale").isActive(true).build();

        CreateReservationRequest request = new CreateReservationRequest(
                "Jean Martin", "0470000000", null, 4, LocalDateTime.of(2026, 12, 1, 20, 0), tableId
        );

        when(tableRepository.findById(tableId)).thenReturn(Optional.of(table));
        when(reservationRepository.existsByTableIdAndStatusInAndReservationTimeBetween(
                eq(tableId), any(), any(), any()
        )).thenReturn(true);

        assertThatThrownBy(() -> reservationService.createReservation(request))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("déjà réservée");
    }
}