package com.restomanager.order_service.dto;

import java.math.BigDecimal;
import java.util.Map;

public record SalesReportResponse(
    long paidOrdersCount,
    BigDecimal totalExclVat,
    BigDecimal totalVat,
    BigDecimal totalInclVat,
    BigDecimal totalDiscounts,
    Map<String, BigDecimal> vatBreakdownByRate
) {}