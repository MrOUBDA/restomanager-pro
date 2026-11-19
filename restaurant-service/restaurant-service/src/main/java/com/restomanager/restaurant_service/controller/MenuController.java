package com.restomanager.restaurant_service.controller;

import com.restomanager.restaurant_service.dto.*;
import com.restomanager.restaurant_service.entity.Category;
import com.restomanager.restaurant_service.service.MenuService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/menu")
@RequiredArgsConstructor
public class MenuController {
    private final MenuService menuService;

    @GetMapping("/categories")
    public List<Category> getCategories() {
        return menuService.getAllCategories();
    }

    @GetMapping("/products")
    public List<ProductResponse> getProducts() {
        return menuService.getAllProducts();
    }

    @PostMapping("/products")
    @ResponseStatus(HttpStatus.CREATED)
    public ProductResponse createProduct(@Valid @RequestBody CreateProductRequest request) {
        return menuService.createProduct(request);
    }

    @PatchMapping("/products/{id}/availability")
    public ProductResponse toggleAvailability(@PathVariable UUID id) {
        return menuService.toggleAvailability(id);
    }
}
