package com.restomanager.order_service.service;

import com.restomanager.order_service.dto.SalesReportResponse;
import com.restomanager.order_service.entity.Order;
import com.restomanager.order_service.entity.OrderItem;
import com.restomanager.order_service.entity.OrderStatus;
import com.restomanager.order_service.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ReportingService {
    private final OrderRepository orderRepository;

    @Transactional(readOnly = true)
    public SalesReportResponse getSalesSummary() {
        List<Order> paidOrders = orderRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(o -> o.getStatus() == OrderStatus.PAID)
                .toList();

        BigDecimal totalExcl = BigDecimal.ZERO;
        BigDecimal totalIncl = BigDecimal.ZERO;
        BigDecimal totalDiscounts = BigDecimal.ZERO;
        Map<String, BigDecimal> vatByRate = new LinkedHashMap<>();

        for (Order o : paidOrders) {
            totalExcl = totalExcl.add(o.getTotalExclVat());
            totalIncl = totalIncl.add(o.getTotalInclVat());
            totalDiscounts = totalDiscounts.add(o.getDiscountAmount());

            for (OrderItem item : o.getItems()) {
                BigDecimal lineExcl = item.getUnitPriceExclVatSnapshot()
                        .multiply(BigDecimal.valueOf(item.getQuantity()));
                BigDecimal lineVat = lineExcl
                        .multiply(item.getVatRateSnapshot())
                        .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

                String key = item.getVatRateSnapshot().stripTrailingZeros().toPlainString() + "%";
                vatByRate.merge(key, lineVat, BigDecimal::add);
            }
        }

        BigDecimal totalVat = totalIncl.subtract(totalExcl).add(totalDiscounts).max(BigDecimal.ZERO);

        return new SalesReportResponse(
                paidOrders.size(),
                totalExcl.setScale(2, RoundingMode.HALF_UP),
                totalVat.setScale(2, RoundingMode.HALF_UP),
                totalIncl.setScale(2, RoundingMode.HALF_UP),
                totalDiscounts.setScale(2, RoundingMode.HALF_UP),
                vatByRate
        );
    }

    @Transactional(readOnly = true)
    public String generatePaidOrdersCsv() {
        List<Order> paidOrders = orderRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(o -> o.getStatus() == OrderStatus.PAID)
                .toList();

        StringBuilder sb = new StringBuilder();
        sb.append("Order_ID;Table;Created_At;Closed_At;Total_HTVA;Remise;Total_TTC\n");
        for (Order o : paidOrders) {
            sb.append(o.getId()).append(';')
              .append("Table ").append(o.getTableNumberSnapshot()).append(';')
              .append(o.getCreatedAt()).append(';')
              .append(o.getClosedAt() != null ? o.getClosedAt() : "").append(';')
              .append(o.getTotalExclVat()).append(';')
              .append(o.getDiscountAmount()).append(';')
              .append(o.getTotalInclVat()).append('\n');
        }
        return sb.toString();
    }
}