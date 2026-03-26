
CREATE TABLE IF NOT EXISTS menu_items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  tag VARCHAR(100),
  tag_color VARCHAR(50),
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO menu_items (name, description, price, tag, tag_color, image_url, sort_order) VALUES
('Флэт Уайт', 'Двойной эспрессо, бархатистое молоко и тонкая молочная пенка. Классика в чистом виде.', 280, 'Хит', 'default', 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80', 1),
('Карамельный Латте', 'Нежный латте с домашней карамелью и щепоткой морской соли.', 350, 'Новинка', 'secondary', 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80', 2),
('Матча Латте', 'Японский матча премиум-класса с овсяным молоком. Мягко, зелено и очень вкусно.', 380, 'Популярное', 'accent', 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80', 3);
