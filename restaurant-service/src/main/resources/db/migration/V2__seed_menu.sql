INSERT INTO categories (id, name, display_order) VALUES
    (gen_random_uuid(), 'Entrées', 1),
    (gen_random_uuid(), 'Plats principaux', 2),
    (gen_random_uuid(), 'Desserts', 3),
    (gen_random_uuid(), 'Boissons', 4);

INSERT INTO products (id, name, description, price_excl_vat, vat_rate, is_available, category_id)
SELECT gen_random_uuid(), 'Croquettes aux crevettes grises', 'Deux croquettes artisanales, persil frit et citron', 14.50, 12.00, TRUE, id
FROM categories WHERE name = 'Entrées';

INSERT INTO products (id, name, description, price_excl_vat, vat_rate, is_available, category_id)
SELECT gen_random_uuid(), 'Carbonnade flamande à la bière brune', 'Boeuf mijoté lentement, frites fraîches et salade', 19.80, 12.00, TRUE, id
FROM categories WHERE name = 'Plats principaux';

INSERT INTO products (id, name, description, price_excl_vat, vat_rate, is_available, category_id)
SELECT gen_random_uuid(), 'Dame Blanche', 'Glace vanille artisanale, chocolat chaud et chantilly', 8.20, 12.00, TRUE, id
FROM categories WHERE name = 'Desserts';

INSERT INTO products (id, name, description, price_excl_vat, vat_rate, is_available, category_id)
SELECT gen_random_uuid(), 'Bière d''Abbaye 33cl', 'Pression blonde locale', 3.72, 21.00, TRUE, id
FROM categories WHERE name = 'Boissons';
