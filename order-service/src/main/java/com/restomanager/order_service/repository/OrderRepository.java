package com.restomanager.order_service.repository;

import com.restomanager.order_service.entity.Order;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface OrderRepository extends JpaRepository<Order, UUID> {
    @EntityGraph(attributePaths = "items")
    List<Order> findAllByOrderByCreatedAtDesc();
}