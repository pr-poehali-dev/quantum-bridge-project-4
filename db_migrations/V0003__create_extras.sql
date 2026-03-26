
CREATE TABLE IF NOT EXISTS extras (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO extras (name, price, sort_order) VALUES
('Доп. шот эспрессо', 50, 1),
('Молоко овсяное', 60, 2),
('Молоко кокосовое', 60, 3),
('Сироп карамель', 40, 4),
('Сироп ваниль', 40, 5),
('Взбитые сливки', 50, 6);
