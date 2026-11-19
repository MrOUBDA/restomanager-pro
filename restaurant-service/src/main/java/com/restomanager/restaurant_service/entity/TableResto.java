package com.restomanager.restaurant_service.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
@Table(name = "tables_resto")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TableResto {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "table_number", nullable = false, unique = true)
    private Integer tableNumber;

    @Column(nullable = false)
    private Integer capacity;

    @Column(nullable = false, length = 50)
    private String zone;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive;
}