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

-- Empty table and identifiers requiring quoting must still be exposed.
CREATE TABLE "order notes" (
  order_id BIGINT NULL,
  "note""text" TEXT NULL
);

-- Deliberately read-only; these credentials are only for this local fixture.
CREATE USER ava_test WITH PASSWORD 'ava_test_password';
GRANT CONNECT ON DATABASE ava_postgresql_test TO ava_test;
GRANT USAGE ON SCHEMA public TO ava_test;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO ava_test;
