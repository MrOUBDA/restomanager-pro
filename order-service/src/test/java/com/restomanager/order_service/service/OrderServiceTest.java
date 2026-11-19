package com.restomanager.order_service.service;

import com.restomanager.order_service.client.RestaurantServiceClient;
import com.restomanager.order_service.client.RestaurantServiceClient.RemoteProduct;
import com.restomanager.order_service.client.RestaurantServiceClient.RemoteTable;
import com.restomanager.order_service.dto.CreateOrderRequest;
import com.restomanager.order_service.dto.OrderItemRequest;
import com.restomanager.order_service.dto.OrderResponse;
import com.restomanager.order_service.entity.Order;
import com.restomanager.order_service.repository.OrderRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private RestaurantServiceClient restaurantClient;

    @InjectMocks
    private OrderService orderService;

    @Test
    void createOrder_shouldSnapshotPricesAndComputeMixedVatTotals() {
        UUID tableId = UUID.randomUUID();
        UUID foodId = UUID.randomUUID();
        UUID drinkId = UUID.randomUUID();

        when(restaurantClient.fetchAllTables()).thenReturn(List.of(
                new RemoteTable(tableId, 4, 6, "Salle principale", true)
        ));
        when(restaurantClient.fetchAllProducts()).thenReturn(List.of(
                new RemoteProduct(foodId, "Carbonnade", new BigDecimal("20.00"), new BigDecimal("12.00"), true),
                new RemoteProduct(drinkId, "Bière", new BigDecimal("4.00"), new BigDecimal("21.00"), true)
        ));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> {
            Order o = inv.getArgument(0);
            o.setId(UUID.randomUUID());
            return o;
        });

        CreateOrderRequest req = new CreateOrderRequest(
                tableId,
                null,
                new BigDecimal("2.00"),
                false,
                List.of(
                        new OrderItemRequest(foodId, 1, "Sans moutarde"),
                        new OrderItemRequest(drinkId, 2, null)
                )
        );

        OrderResponse res = orderService.createOrder(req);

        // HTVA: 20.00 + (2 * 4.00) = 28.00
        // TTC avant remise: 22.40 + (2 * 4.84 = 9.68) = 32.08 -> après remise 2.00 = 30.08
        assertThat(res.tableNumber()).isEqualTo(4);
        assertThat(res.totalExclVat()).isEqualByComparingTo("28.00");
        assertThat(res.totalInclVat()).isEqualByComparingTo("30.08");
        assertThat(res.items()).hasSize(2);
    }
}