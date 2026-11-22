ALTER TABLE tables_resto
    ADD COLUMN pos_x INTEGER NOT NULL DEFAULT 15,
    ADD COLUMN pos_y INTEGER NOT NULL DEFAULT 20;

UPDATE tables_resto
SET pos_x = ((table_number - 1) % 3) * 30 + 12,
    pos_y = ((table_number - 1) / 3) * 38 + 18;