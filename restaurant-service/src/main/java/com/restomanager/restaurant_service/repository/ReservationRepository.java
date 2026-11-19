package com.restomanager.restaurant_service.repository;

import com.restomanager.restaurant_service.entity.Reservation;
import com.restomanager.restaurant_service.entity.ReservationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface ReservationRepository extends JpaRepository<Reservation, UUID> {
    List<Reservation> findAllByOrderByReservationTimeAsc();

    boolean existsByTableIdAndStatusInAndReservationTimeBetween(
            UUID tableId,
            Collection<ReservationStatus> statuses,
            LocalDateTime startWindow,
            LocalDateTime endWindow
    );
}