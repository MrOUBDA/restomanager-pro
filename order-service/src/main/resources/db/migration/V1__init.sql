CREATE TABLE orders (
    id UUID PRIMARY KEY,
    table_id UUID NOT NULL,
    table_number_snapshot INT NOT NULL,
    waiter_id UUID NOT NULL,
    status VARCHAR(30) NOT NULL,
    discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total_excl_vat DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total_incl_vat DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP
);

CREATE TABLE order_items (
    id UUID PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL,
    product_name_snapshot VARCHAR(150) NOT NULL,
    unit_price_excl_vat_snapshot DECIMAL(10, 2) NOT NULL,
    vat_rate_snapshot DECIMAL(4, 2) NOT NULL,
    quantity INT NOT NULL,
    notes VARCHAR(255)
);
