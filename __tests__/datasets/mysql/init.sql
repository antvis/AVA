-- Disposable fixture database only. Docker's entrypoint runs this on first startup.
CREATE DATABASE IF NOT EXISTS ava_mysql_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ava_mysql_test;

CREATE TABLE customers (
  tenant_id INT NOT NULL,
  customer_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NULL,
  created_on DATE NOT NULL,
  profile JSON NULL,
  PRIMARY KEY (tenant_id, customer_id),
  UNIQUE KEY uq_customers_email (tenant_id, email)
) ENGINE=InnoDB;

CREATE TABLE orders (
  order_id BIGINT UNSIGNED NOT NULL,
  tenant_id INT NOT NULL,
  customer_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status ENUM('pending', 'paid', 'cancelled') NOT NULL,
  placed_at DATETIME NOT NULL,
  note TEXT NULL,
  PRIMARY KEY (order_id),
  KEY idx_orders_customer (tenant_id, customer_id),
  KEY idx_orders_status_time (status, placed_at),
  CONSTRAINT fk_orders_customer FOREIGN KEY (tenant_id, customer_id)
    REFERENCES customers (tenant_id, customer_id)
) ENGINE=InnoDB;

-- Identifiers requiring quoting must still be exposed.
CREATE TABLE `order notes` (
  order_id BIGINT UNSIGNED NULL,
  `note"text` TEXT NULL
) ENGINE=InnoDB;

INSERT INTO customers (tenant_id, customer_id, name, email, created_on, profile) VALUES
  (1, 101, 'Alice', 'alice@example.com', '2024-01-10', JSON_OBJECT('tier', 'gold')),
  (1, 102, 'Bob', NULL, '2024-02-20', NULL),
  (2, 201, 'Carol', 'carol@example.com', '2024-02-20', JSON_OBJECT('tier', 'silver'));

INSERT INTO orders (order_id, tenant_id, customer_id, amount, status, placed_at, note) VALUES
  (1001, 1, 101, 19.90, 'paid', '2024-03-01 09:00:00', 'first order'),
  (1002, 1, 101, 35.50, 'pending', '2024-03-02 10:30:00', NULL),
  (1003, 1, 102, 10.00, 'cancelled', '2024-03-03 11:45:00', 'customer cancelled'),
  (1004, 2, 201, 34.60, 'paid', '2024-03-04 14:00:00', NULL);

INSERT INTO `order notes` (order_id, `note"text`) VALUES
  (1001, 'gift wrap'),
  (1002, NULL);

-- Deliberately read-only; these credentials are only for this local fixture.
CREATE USER IF NOT EXISTS 'ava_test'@'%' IDENTIFIED BY 'ava_test_password';
GRANT SELECT ON ava_mysql_test.* TO 'ava_test'@'%';
