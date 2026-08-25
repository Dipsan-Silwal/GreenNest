CREATE DATABASE IF NOT EXISTS greennest CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE greennest;

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'customer', 'expert') NOT NULL,
  display_name VARCHAR(120) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  category VARCHAR(80) NOT NULL,
  environments JSON NOT NULL,
  light VARCHAR(20) NOT NULL DEFAULT 'any',
  price DECIMAL(10,2) NOT NULL,
  stock INT UNSIGNED NOT NULL DEFAULT 0,
  image TEXT,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wallets (
  user_id INT UNSIGNED PRIMARY KEY,
  balance DECIMAL(12,2) NOT NULL DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  type ENUM('credit', 'debit') NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  label VARCHAR(160) NOT NULL,
  reference VARCHAR(80),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS orders (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  customer_id INT UNSIGNED NOT NULL,
  total DECIMAL(12,2) NOT NULL,
  shipping JSON,
  status VARCHAR(40) NOT NULL DEFAULT 'Approved',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS order_items (
  order_id BIGINT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (order_id, product_id),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS bookings (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  customer_id INT UNSIGNED NOT NULL,
  expert_id INT UNSIGNED NOT NULL,
  preferred_date DATE NOT NULL,
  preferred_time VARCHAR(60) NOT NULL,
  note TEXT,
  status VARCHAR(40) NOT NULL DEFAULT 'Pending confirmation',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES users(id),
  FOREIGN KEY (expert_id) REFERENCES users(id)
);

INSERT IGNORE INTO users (username, password, role, display_name) VALUES
  ('admin', 'admin', 'admin', 'Admin'),
  ('customer', 'customer', 'customer', 'Aanya Sharma'),
  ('meera', 'meera', 'customer', 'Meera Koirala'),
  ('sujan', 'sujan', 'customer', 'Sujan Bhandari'),
  ('expert', 'expert', 'expert', 'Sabina Gurung'),
  ('bikash', 'bikash', 'expert', 'Bikash Thapa'),
  ('anisha', 'anisha', 'expert', 'Anisha Rai');

INSERT IGNORE INTO wallets (user_id, balance)
  SELECT id, CASE WHEN role = 'customer' THEN 5000 WHEN role = 'expert' THEN 3000 ELSE 0 END
  FROM users;
