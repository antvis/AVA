-- Fixture for the BigQuery integration tests. Run it once as a project owner, for example in
-- the BigQuery console of the test project. It uses DDL only, so it also works in the BigQuery
-- sandbox, where DML is unavailable. Tables expire after 60 days in the sandbox; run it again then.

CREATE SCHEMA IF NOT EXISTS ava_bigquery_test OPTIONS (location = 'US');

CREATE OR REPLACE TABLE ava_bigquery_test.customers (
  customer_id INT64 NOT NULL,
  tenant_id INT64 NOT NULL,
  name STRING NOT NULL,
  email STRING,
  created_on DATE NOT NULL,
  profile JSON,
  tags ARRAY<STRING>,
  address STRUCT<city STRING, zip STRING>
) AS
SELECT * FROM UNNEST([
  STRUCT(101 AS customer_id, 1 AS tenant_id, 'Alice' AS name, 'alice@example.com' AS email,
    DATE '2024-01-10' AS created_on, JSON '{"tier":"gold"}' AS profile, ['vip', 'beta'] AS tags,
    STRUCT('Hangzhou' AS city, '310000' AS zip) AS address),
  (102, 1, 'Bob', NULL, DATE '2024-02-20', NULL, [], STRUCT('Shanghai', '200000')),
  (201, 2, 'Carol', 'carol@example.com', DATE '2024-02-20', JSON '{"tier":"silver"}', ['beta'], NULL)
]);

CREATE OR REPLACE TABLE ava_bigquery_test.orders (
  order_id INT64 NOT NULL,
  customer_id INT64 NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  status STRING NOT NULL,
  placed_at TIMESTAMP NOT NULL,
  note STRING
) AS
SELECT * FROM UNNEST([
  STRUCT(1001 AS order_id, 101 AS customer_id, NUMERIC '19.90' AS amount, 'paid' AS status,
    TIMESTAMP '2024-03-01 09:00:00 UTC' AS placed_at, 'first order' AS note),
  (1002, 101, NUMERIC '35.50', 'pending', TIMESTAMP '2024-03-02 10:30:00 UTC', NULL),
  (1003, 102, NUMERIC '10.00', 'cancelled', TIMESTAMP '2024-03-03 11:45:00 UTC', 'customer cancelled'),
  (1004, 201, NUMERIC '34.60', 'paid', TIMESTAMP '2024-03-04 14:00:00.123456 UTC', NULL)
]);

-- Table and column names with spaces exercise identifier quoting.
CREATE OR REPLACE TABLE ava_bigquery_test.`order notes` AS
SELECT * FROM UNNEST([
  STRUCT(1001 AS order_id, 'gift wrap' AS `note text`),
  (1002, NULL)
]);

-- Every GoogleSQL type in one row, including values that JSON numbers cannot hold exactly.
CREATE OR REPLACE TABLE ava_bigquery_test.value_types AS
SELECT
  9007199254740993 AS big_int,
  42 AS small_int,
  CAST('NaN' AS FLOAT64) AS not_a_number,
  1.5 AS float_value,
  NUMERIC '12345678901234567890.123456789' AS wide_numeric,
  NUMERIC '19.90' AS exact_numeric,
  BIGNUMERIC '0.1' AS big_numeric,
  TRUE AS flag,
  'hé "quoted"' AS text,
  FROM_BASE64('AP8=') AS raw_bytes,
  DATE '0001-01-01' AS first_day,
  DATETIME '9999-12-31 23:59:59.999999' AS last_datetime,
  TIME '12:34:56.000001' AS clock,
  TIMESTAMP '1969-12-31 23:59:59.999999 UTC' AS before_epoch,
  ST_GEOGPOINT(120.15, 30.28) AS point,
  JSON '{"a":[1,2,{"b":null}]}' AS document,
  MAKE_INTERVAL(1, 2, 3, 4, 5, 6) AS duration,
  RANGE(DATE '2024-01-01', DATE '2024-02-01') AS period,
  [1, 2, 3] AS numbers,
  STRUCT(7 AS x, [STRUCT('z1' AS z), STRUCT('z2' AS z)] AS y) AS nested,
  CAST(NULL AS STRING) AS missing;

CREATE OR REPLACE VIEW ava_bigquery_test.paid_orders AS
SELECT order_id, customer_id, amount FROM ava_bigquery_test.orders WHERE status = 'paid';

-- Unenforced keys describe relationships for schema discovery.
ALTER TABLE ava_bigquery_test.customers ADD PRIMARY KEY (customer_id) NOT ENFORCED;
ALTER TABLE ava_bigquery_test.orders ADD PRIMARY KEY (order_id) NOT ENFORCED;
ALTER TABLE ava_bigquery_test.orders
  ADD CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id)
  REFERENCES ava_bigquery_test.customers (customer_id) NOT ENFORCED;
ALTER TABLE ava_bigquery_test.`order notes`
  ADD CONSTRAINT fk_notes_order FOREIGN KEY (order_id)
  REFERENCES ava_bigquery_test.orders (order_id) NOT ENFORCED;
