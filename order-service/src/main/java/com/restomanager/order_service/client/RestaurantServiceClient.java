package com.restomanager.order_service.client;

import lombok.RequiredArgsConstructor;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class RestaurantServiceClient {
    private final RestClient restaurantRestClient;

    public record RemoteProduct(
            UUID id,
            String name,
            BigDecimal priceExclVat,
            BigDecimal vatRate,
            Boolean isAvailable
    ) {}

    public record RemoteTable(
            UUID id,
            Integer tableNumber,
            Integer capacity,
            String zone,
            Boolean isActive
    ) {}

    public List<RemoteProduct> fetchAllProducts() {
        return restaurantRestClient.get()
                .uri("/api/menu/products")
                .retrieve()
                .body(new ParameterizedTypeReference<>() {});
    }

    public List<RemoteTable> fetchAllTables() {
        return restaurantRestClient.get()
                .uri("/api/room/tables")
                .retrieve()
                .body(new ParameterizedTypeReference<>() {});
    }
}