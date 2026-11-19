package com.restomanager.restaurant_service.service;

import com.restomanager.restaurant_service.dto.*;
import com.restomanager.restaurant_service.entity.*;
import com.restomanager.restaurant_service.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MenuService {
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public List<Category> getAllCategories() {
        return categoryRepository.findAllByOrderByDisplayOrderAsc();
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> getAllProducts() {
        return productRepository.findAllByOrderByNameAsc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ProductResponse createProduct(CreateProductRequest request) {
        Category category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new IllegalArgumentException("Catégorie introuvable"));

        Product product = Product.builder()
                .name(request.name())
                .description(request.description())
                .priceExclVat(request.priceExclVat())
                .vatRate(request.vatRate())
                .isAvailable(true)
                .category(category)
                .build();

        return toResponse(productRepository.save(product));
    }

    @Transactional
    public ProductResponse toggleAvailability(UUID productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Produit introuvable"));
        product.setIsAvailable(!product.getIsAvailable());
        return toResponse(productRepository.save(product));
    }

    private ProductResponse toResponse(Product p) {
        BigDecimal vatMultiplier = BigDecimal.ONE.add(
                p.getVatRate().divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP)
        );
        BigDecimal priceInclVat = p.getPriceExclVat().multiply(vatMultiplier).setScale(2, RoundingMode.HALF_UP);

        return new ProductResponse(
                p.getId(),
                p.getName(),
                p.getDescription(),
                p.getPriceExclVat(),
                p.getVatRate(),
                priceInclVat,
                p.getIsAvailable(),
                p.getCategory().getId(),
                p.getCategory().getName()
        );
    }
}
