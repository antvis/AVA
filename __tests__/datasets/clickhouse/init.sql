CREATE DATABASE IF NOT EXISTS ava_clickhouse_test;

CREATE TABLE ava_clickhouse_test.customers
(
  tenant_id UInt32,
  customer_id UInt32,
  name String,
  email Nullable(String),
  created_on Date,
  profile Nullable(String)
)
ENGINE = MergeTree
PRIMARY KEY (tenant_id, customer_id)
ORDER BY (tenant_id, customer_id);

CREATE TABLE ava_clickhouse_test.orders
(
  order_id UInt64,
  tenant_id UInt32,
  customer_id UInt32,
  amount Decimal(10, 2),
  status Enum8('pending' = 1, 'paid' = 2, 'cancelled' = 3),
  placed_at DateTime,
  note Nullable(String)
)
ENGINE = MergeTree
PRIMARY KEY (order_id)
ORDER BY (order_id);

CREATE TABLE ava_clickhouse_test.`order notes`
(
  order_id Nullable(UInt64),
  `note"text` Nullable(String)
)
ENGINE = MergeTree
ORDER BY tuple();

INSERT INTO ava_clickhouse_test.customers (tenant_id, customer_id, name, email, created_on, profile) VALUES
  (1, 101, 'Alice', 'alice@example.com', '2024-01-10', '{"tier":"gold"}'),
  (1, 102, 'Bob', NULL, '2024-02-20', NULL),
  (2, 201, 'Carol', 'carol@example.com', '2024-02-20', '{"tier":"silver"}');

INSERT INTO ava_clickhouse_test.orders (order_id, tenant_id, customer_id, amount, status, placed_at, note) VALUES
  (1001, 1, 101, 19.90, 'paid', '2024-03-01 09:00:00', 'first order'),
  (1002, 1, 101, 35.50, 'pending', '2024-03-02 10:30:00', NULL),
  (1003, 1, 102, 10.00, 'cancelled', '2024-03-03 11:45:00', 'customer cancelled'),
  (1004, 2, 201, 34.60, 'paid', '2024-03-04 14:00:00', NULL);

INSERT INTO ava_clickhouse_test.`order notes` (order_id, `note"text`) VALUES
  (1001, 'gift wrap'),
  (1002, NULL);

CREATE USER IF NOT EXISTS ava_test IDENTIFIED WITH plaintext_password BY 'ava_test_password';
GRANT SELECT ON ava_clickhouse_test.* TO ava_test;
