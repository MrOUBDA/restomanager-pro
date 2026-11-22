package com.restomanager.restaurant_service.repository;

import com.restomanager.restaurant_service.entity.TableResto;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface TableRestoRepository extends JpaRepository<TableResto, UUID> {
    List<TableResto> findByIsActiveTrueOrderByTableNumberAsc();
    List<TableResto> findAllByOrderByTableNumberAsc();
    boolean existsByTableNumberAndIsActiveTrue(Integer tableNumber);
    List<TableResto> findByIsActiveTrueAndCapacityGreaterThanEqualOrderByCapacityAscTableNumberAsc(Integer minCapacity);
}