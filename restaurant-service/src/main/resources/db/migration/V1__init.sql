CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role VARCHAR(30) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tables_resto (
    id UUID PRIMARY KEY,
    table_number INT NOT NULL UNIQUE,
    capacity INT NOT NULL,
    zone VARCHAR(50) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE reservations (
    id UUID PRIMARY KEY,
    customer_name VARCHAR(150) NOT NULL,
    customer_phone VARCHAR(30) NOT NULL,
    customer_email VARCHAR(150),
    guest_count INT NOT NULL,
    reservation_time TIMESTAMP NOT NULL,
    status VARCHAR(30) NOT NULL,
    table_id UUID REFERENCES tables_resto(id)
);

CREATE TABLE categories (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    display_order INT NOT NULL DEFAULT 0
);

CREATE TABLE products (
    id UUID PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price_excl_vat DECIMAL(10, 2) NOT NULL,
    vat_rate DECIMAL(4, 2) NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    category_id UUID NOT NULL REFERENCES categories(id)
);
