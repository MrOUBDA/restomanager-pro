package com.restomanager.order_service.service;

import com.restomanager.order_service.client.RestaurantServiceClient;
import com.restomanager.order_service.client.RestaurantServiceClient.*;
import com.restomanager.order_service.dto.*;
import com.restomanager.order_service.entity.*;
import com.restomanager.order_service.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {
    private static final UUID DEFAULT_WAITER_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    private final OrderRepository orderRepository;
    private final RestaurantServiceClient restaurantClient;

    @Transactional(readOnly = true)
    public List<OrderResponse> getAllOrders() {
        return orderRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public OrderResponse createOrder(CreateOrderRequest req) {
        RemoteTable table = restaurantClient.fetchAllTables().stream()
                .filter(t -> t.id().equals(req.tableId()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Table introuvable dans restaurant-service"));

        Map<UUID, RemoteProduct> productMap = restaurantClient.fetchAllProducts().stream()
                .collect(Collectors.toMap(RemoteProduct::id, Function.identity()));

        BigDecimal discount = req.discountAmount() != null ? req.discountAmount() : BigDecimal.ZERO;
        BigDecimal totalExclVat = BigDecimal.ZERO;
        BigDecimal totalInclVat = BigDecimal.ZERO;

        Order order = Order.builder()
                .tableId(table.id())
                .tableNumberSnapshot(table.tableNumber())
                .waiterId(req.waiterId() != null ? req.waiterId() : DEFAULT_WAITER_ID)
                .status(OrderStatus.SENT_TO_KITCHEN)
                .discountAmount(discount)
                .createdAt(LocalDateTime.now())
                .build();

        for (OrderItemRequest itemReq : req.items()) {
            RemoteProduct prod = productMap.get(itemReq.productId());
            if (prod == null) {
                throw new IllegalArgumentException("Produit introuvable : " + itemReq.productId());
            }
            if (!Boolean.TRUE.equals(prod.isAvailable())) {
                throw new IllegalStateException("Le produit '" + prod.name() + "' est actuellement épuisé");
            }

            BigDecimal qty = BigDecimal.valueOf(itemReq.quantity());
            BigDecimal lineExcl = prod.priceExclVat().multiply(qty);
            BigDecimal vatMultiplier = BigDecimal.ONE.add(
                    prod.vatRate().divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP)
            );
            BigDecimal lineIncl = lineExcl.multiply(vatMultiplier).setScale(2, RoundingMode.HALF_UP);

            totalExclVat = totalExclVat.add(lineExcl);
            totalInclVat = totalInclVat.add(lineIncl);

            OrderItem item = OrderItem.builder()
                    .productId(prod.id())
                    .productNameSnapshot(prod.name())
                    .unitPriceExclVatSnapshot(prod.priceExclVat())
                    .vatRateSnapshot(prod.vatRate())
                    .quantity(itemReq.quantity())
                    .notes(itemReq.notes())
                    .build();
            order.addItem(item);
        }

        order.setTotalExclVat(totalExclVat.setScale(2, RoundingMode.HALF_UP));
        BigDecimal finalInclVat = totalInclVat.subtract(discount).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
        order.setTotalInclVat(finalInclVat);

        return toResponse(orderRepository.save(order));
    }

    @Transactional
    public OrderResponse updateOrderStatus(UUID orderId, OrderStatus newStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Commande introuvable"));
        order.setStatus(newStatus);
        if (newStatus == OrderStatus.PAID || newStatus == OrderStatus.CANCELLED) {
            order.setClosedAt(LocalDateTime.now());
        }
        return toResponse(orderRepository.save(order));
    }

    private OrderResponse toResponse(Order o) {
        List<OrderItemResponse> itemResponses = o.getItems().stream().map(i -> {
            BigDecimal vatMult = BigDecimal.ONE.add(
                    i.getVatRateSnapshot().divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP)
            );
            BigDecimal lineIncl = i.getUnitPriceExclVatSnapshot()
                    .multiply(BigDecimal.valueOf(i.getQuantity()))
                    .multiply(vatMult)
                    .setScale(2, RoundingMode.HALF_UP);

            return new OrderItemResponse(
                    i.getId(),
                    i.getProductId(),
                    i.getProductNameSnapshot(),
                    i.getUnitPriceExclVatSnapshot(),
                    i.getVatRateSnapshot(),
                    i.getQuantity(),
                    i.getNotes(),
                    lineIncl
            );
        }).toList();

        return new OrderResponse(
                o.getId(),
                o.getTableId(),
                o.getTableNumberSnapshot(),
                o.getStatus(),
                o.getDiscountAmount(),
                o.getTotalExclVat(),
                o.getTotalInclVat(),
                o.getCreatedAt(),
                o.getClosedAt(),
                itemResponses
        );
    }
}