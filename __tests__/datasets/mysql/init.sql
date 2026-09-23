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

-- Empty table and identifiers requiring quoting must still be exposed.
CREATE TABLE `order notes` (
  order_id BIGINT UNSIGNED NULL,
  `note"text` TEXT NULL
) ENGINE=InnoDB;

-- Deliberately read-only; these credentials are only for this local fixture.
CREATE USER IF NOT EXISTS 'ava_test'@'%' IDENTIFIED BY 'ava_test_password';
GRANT SELECT ON ava_mysql_test.* TO 'ava_test'@'%';
