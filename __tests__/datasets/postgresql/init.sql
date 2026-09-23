-- Disposable fixture database only. Docker's entrypoint runs this on first startup.
-- The database ava_postgresql_test is created by POSTGRES_DB in compose.yaml.
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'cancelled');

CREATE TABLE customers (
  tenant_id INTEGER NOT NULL,
  customer_id INTEGER NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NULL,
  created_on DATE NOT NULL,
  profile JSONB NULL,
  CONSTRAINT customers_pkey PRIMARY KEY (tenant_id, customer_id),
  CONSTRAINT uq_customers_email UNIQUE (tenant_id, email)
);

CREATE TABLE orders (
  order_id BIGINT NOT NULL,
  tenant_id INTEGER NOT NULL,
  customer_id INTEGER NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  status order_status NOT NULL,
  placed_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  note TEXT NULL,
  CONSTRAINT orders_pkey PRIMARY KEY (order_id),
  CONSTRAINT fk_orders_customer FOREIGN KEY (tenant_id, customer_id)
    REFERENCES customers (tenant_id, customer_id)
);
CREATE INDEX idx_orders_customer ON orders (tenant_id, customer_id);
CREATE INDEX idx_orders_status_time ON orders (status, placed_at);

-- Identifiers requiring quoting must still be exposed.
CREATE TABLE "order notes" (
  order_id BIGINT NULL,
  "note""text" TEXT NULL
);

INSERT INTO customers (tenant_id, customer_id, name, email, created_on, profile) VALUES
  (1, 101, 'Alice', 'alice@example.com', '2024-01-10', '{"tier":"gold"}'),
  (1, 102, 'Bob', NULL, '2024-02-20', NULL),
  (2, 201, 'Carol', 'carol@example.com', '2024-02-20', '{"tier":"silver"}');

INSERT INTO orders (order_id, tenant_id, customer_id, amount, status, placed_at, note) VALUES
  (1001, 1, 101, 19.90, 'paid', '2024-03-01 09:00:00', 'first order'),
  (1002, 1, 101, 35.50, 'pending', '2024-03-02 10:30:00', NULL),
  (1003, 1, 102, 10.00, 'cancelled', '2024-03-03 11:45:00', 'customer cancelled'),
  (1004, 2, 201, 34.60, 'paid', '2024-03-04 14:00:00', NULL);

INSERT INTO "order notes" (order_id, "note""text") VALUES
  (1001, 'gift wrap'),
  (1002, NULL);

-- Deliberately read-only; these credentials are only for this local fixture.
CREATE USER ava_test WITH PASSWORD 'ava_test_password';
GRANT CONNECT ON DATABASE ava_postgresql_test TO ava_test;
GRANT USAGE ON SCHEMA public TO ava_test;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO ava_test;
