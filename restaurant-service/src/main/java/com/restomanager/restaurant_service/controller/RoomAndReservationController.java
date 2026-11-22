package com.restomanager.restaurant_service.controller;

import com.restomanager.restaurant_service.dto.*;
import com.restomanager.restaurant_service.entity.ReservationStatus;
import com.restomanager.restaurant_service.entity.TableResto;
import com.restomanager.restaurant_service.service.ReservationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/room")
@RequiredArgsConstructor
public class RoomAndReservationController {
    private final ReservationService reservationService;

    @GetMapping("/tables")
    public List<TableResto> getTables() {
        return reservationService.getAllTables();
    }

    @PostMapping("/tables")
    @ResponseStatus(HttpStatus.CREATED)
    public TableResto createTable(@Valid @RequestBody CreateTableRequest request) {
        return reservationService.createTable(request);
    }

    @PatchMapping("/tables/{id}/position")
    public TableResto updateTablePosition(@PathVariable UUID id, @Valid @RequestBody UpdateTablePositionRequest request) {
        return reservationService.updateTablePosition(id, request);
    }

    @DeleteMapping("/tables/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTable(@PathVariable UUID id) {
        reservationService.deleteTable(id);
    }

    @GetMapping("/reservations")
    public List<ReservationResponse> getReservations() {
        return reservationService.getAllReservations();
    }

    @PostMapping("/reservations")
    @ResponseStatus(HttpStatus.CREATED)
    public ReservationResponse createReservation(@Valid @RequestBody CreateReservationRequest request) {
        return reservationService.createReservation(request);
    }

    @PatchMapping("/reservations/{id}/postpone")
    public ReservationResponse postponeReservation(@PathVariable UUID id, @Valid @RequestBody PostponeReservationRequest request) {
        return reservationService.postponeReservation(id, request);
    }

    @PatchMapping("/reservations/{id}/status")
    public ReservationResponse updateStatus(@PathVariable UUID id, @RequestParam ReservationStatus status) {
        return reservationService.updateStatus(id, status);
    }
}