package com.restomanager.order_service.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "order_items")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OrderItem {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Column(name = "product_id", nullable = false)
    private UUID productId;

    @Column(name = "product_name_snapshot", nullable = false, length = 150)
    private String productNameSnapshot;

    @Column(name = "unit_price_excl_vat_snapshot", nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPriceExclVatSnapshot;

    @Column(name = "vat_rate_snapshot", nullable = false, precision = 4, scale = 2)
    private BigDecimal vatRateSnapshot;

    @Column(nullable = false)
    private Integer quantity;

    @Column(length = 255)
    private String notes;
}