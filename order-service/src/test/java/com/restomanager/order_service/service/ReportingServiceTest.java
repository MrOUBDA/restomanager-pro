package com.restomanager.order_service.service;

import com.restomanager.order_service.dto.SalesReportResponse;
import com.restomanager.order_service.entity.Order;
import com.restomanager.order_service.entity.OrderItem;
import com.restomanager.order_service.entity.OrderStatus;
import com.restomanager.order_service.repository.OrderRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReportingServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @InjectMocks
    private ReportingService reportingService;

    @Test
    void getSalesSummary_shouldOnlyAggregatePaidOrdersAndSplitVat() {
        Order paidOrder = Order.builder()
                .id(UUID.randomUUID())
                .tableNumberSnapshot(2)
                .status(OrderStatus.PAID)
                .discountAmount(BigDecimal.ZERO)
                .totalExclVat(new BigDecimal("100.00"))
                .totalInclVat(new BigDecimal("112.00"))
                .createdAt(LocalDateTime.now())
                .build();
        paidOrder.addItem(OrderItem.builder()
                .productNameSnapshot("Menu dégustation")
                .unitPriceExclVatSnapshot(new BigDecimal("100.00"))
                .vatRateSnapshot(new BigDecimal("12.00"))
                .quantity(1)
                .build());

        Order unpaidOrder = Order.builder()
                .id(UUID.randomUUID())
                .status(OrderStatus.SENT_TO_KITCHEN)
                .totalExclVat(new BigDecimal("50.00"))
                .totalInclVat(new BigDecimal("56.00"))
                .build();

        when(orderRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(paidOrder, unpaidOrder));

        SalesReportResponse summary = reportingService.getSalesSummary();

        assertThat(summary.paidOrdersCount()).isEqualTo(1);
        assertThat(summary.totalInclVat()).isEqualByComparingTo("112.00");
        assertThat(summary.vatBreakdownByRate()).containsEntry("12%", new BigDecimal("12.00"));
    }
}