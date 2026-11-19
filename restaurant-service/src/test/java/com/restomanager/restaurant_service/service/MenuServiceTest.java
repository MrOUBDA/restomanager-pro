package com.restomanager.restaurant_service.service;

import com.restomanager.restaurant_service.dto.CreateProductRequest;
import com.restomanager.restaurant_service.dto.ProductResponse;
import com.restomanager.restaurant_service.entity.Category;
import com.restomanager.restaurant_service.entity.Product;
import com.restomanager.restaurant_service.repository.CategoryRepository;
import com.restomanager.restaurant_service.repository.ProductRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MenuServiceTest {

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private MenuService menuService;

    @Test
    void createProduct_shouldCalculateVatCorrectly() {
        UUID catId = UUID.randomUUID();
        Category category = Category.builder().id(catId).name("Plats").displayOrder(1).build();
        CreateProductRequest request = new CreateProductRequest(
                "Steak frites", "Sauce béarnaise", new BigDecimal("20.00"), new BigDecimal("12.00"), catId
        );

        when(categoryRepository.findById(catId)).thenReturn(Optional.of(category));
        when(productRepository.save(any(Product.class))).thenAnswer(inv -> {
            Product p = inv.getArgument(0);
            p.setId(UUID.randomUUID());
            return p;
        });

        ProductResponse response = menuService.createProduct(request);

        assertThat(response.priceInclVat()).isEqualByComparingTo("22.40");
        assertThat(response.isAvailable()).isTrue();
        assertThat(response.categoryName()).isEqualTo("Plats");
    }
}