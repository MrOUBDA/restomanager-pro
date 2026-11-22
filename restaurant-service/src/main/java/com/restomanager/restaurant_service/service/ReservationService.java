package com.restomanager.restaurant_service.service;

import com.restomanager.restaurant_service.dto.*;
import com.restomanager.restaurant_service.entity.*;
import com.restomanager.restaurant_service.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReservationService {
    private static final Set<ReservationStatus> BLOCKING_STATUSES = Set.of(
            ReservationStatus.CONFIRMED,
            ReservationStatus.SEATED
    );

    private final TableRestoRepository tableRepository;
    private final ReservationRepository reservationRepository;

    @Transactional(readOnly = true)
    public List<TableResto> getAllTables() {
        return tableRepository.findByIsActiveTrueOrderByTableNumberAsc();
    }

    @Transactional
    public TableResto createTable(CreateTableRequest req) {
        if (tableRepository.existsByTableNumberAndIsActiveTrue(req.tableNumber())) {
            throw new IllegalStateException("La table n°" + req.tableNumber() + " existe déjà.");
        }
        TableResto table = TableResto.builder()
                .tableNumber(req.tableNumber())
                .capacity(req.capacity())
                .zone(req.zone().trim())
                .isActive(true)
                .build();
        return tableRepository.save(table);
    }

    @Transactional
    public void deleteTable(UUID tableId) {
        TableResto table = tableRepository.findById(tableId)
                .orElseThrow(() -> new IllegalArgumentException("Table introuvable"));

        if (reservationRepository.existsByTableIdAndStatusIn(tableId, BLOCKING_STATUSES)) {
            throw new IllegalStateException("Impossible de supprimer la table n°" + table.getTableNumber() + " : une réservation confirmée ou en cours y est associée.");
        }

        // Si la table a un historique passé, on la désactive (soft-delete) pour préserver l'intégrité référentielle
        if (reservationRepository.existsByTableIdAndStatusIn(tableId, Set.of(ReservationStatus.COMPLETED, ReservationStatus.CANCELLED))) {
            table.setIsActive(false);
            tableRepository.save(table);
        } else {
            tableRepository.delete(table);
        }
    }

    @Transactional(readOnly = true)
    public List<ReservationResponse> getAllReservations() {
        return reservationRepository.findAllByOrderByReservationTimeAsc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ReservationResponse createReservation(CreateReservationRequest req) {
        LocalDateTime startWindow = req.reservationTime().minusHours(2).plusMinutes(1);
        LocalDateTime endWindow = req.reservationTime().plusHours(2).minusMinutes(1);

        TableResto assignedTable;
        if (req.preferredTableId() != null) {
            assignedTable = tableRepository.findById(req.preferredTableId())
                    .orElseThrow(() -> new IllegalArgumentException("Table demandée introuvable"));
            if (!assignedTable.getIsActive()) {
                throw new IllegalStateException("Cette table est désactivée");
            }
            if (assignedTable.getCapacity() < req.guestCount()) {
                throw new IllegalStateException("Capacité de la table insuffisante (" + assignedTable.getCapacity() + " places max)");
            }
            if (isTableBooked(assignedTable.getId(), startWindow, endWindow)) {
                throw new IllegalStateException("La table n°" + assignedTable.getTableNumber() + " est déjà réservée sur ce créneau");
            }
        } else {
            assignedTable = tableRepository
                    .findByIsActiveTrueAndCapacityGreaterThanEqualOrderByCapacityAscTableNumberAsc(req.guestCount())
                    .stream()
                    .filter(t -> !isTableBooked(t.getId(), startWindow, endWindow))
                    .findFirst()
                    .orElseThrow(() -> new IllegalStateException("Aucune table disponible pour " + req.guestCount() + " personnes sur ce créneau"));
        }

        Reservation reservation = Reservation.builder()
                .customerName(req.customerName())
                .customerPhone(req.customerPhone())
                .customerEmail(req.customerEmail())
                .guestCount(req.guestCount())
                .reservationTime(req.reservationTime())
                .status(ReservationStatus.CONFIRMED)
                .table(assignedTable)
                .build();

        return toResponse(reservationRepository.save(reservation));
    }

    @Transactional
    public ReservationResponse updateStatus(UUID reservationId, ReservationStatus newStatus) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new IllegalArgumentException("Réservation introuvable"));
        reservation.setStatus(newStatus);
        return toResponse(reservationRepository.save(reservation));
    }

    private boolean isTableBooked(UUID tableId, LocalDateTime start, LocalDateTime end) {
        return reservationRepository.existsByTableIdAndStatusInAndReservationTimeBetween(
                tableId, BLOCKING_STATUSES, start, end
        );
    }

    private ReservationResponse toResponse(Reservation r) {
        return new ReservationResponse(
                r.getId(),
                r.getCustomerName(),
                r.getCustomerPhone(),
                r.getCustomerEmail(),
                r.getGuestCount(),
                r.getReservationTime(),
                r.getStatus(),
                r.getTable() != null ? r.getTable().getId() : null,
                r.getTable() != null ? r.getTable().getTableNumber() : null,
                r.getTable() != null ? r.getTable().getZone() : null
        );
    }
}