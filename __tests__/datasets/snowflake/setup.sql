-- One-time account setup for the Snowflake integration tests. Run as ACCOUNTADMIN, for example in a
-- Snowsight SQL worksheet with "Run All" (or select everything, then Ctrl+Enter; without a selection
-- Ctrl+Enter runs only the statement under the cursor). Every statement is idempotent.
--
-- Replace the two <...PUBLIC_KEY> placeholders with the base64 body (no BEGIN/END lines) of RSA keys:
--   openssl genrsa 2048 | openssl pkcs8 -topk8 -inform PEM -out ava_reader_key.p8 -nocrypt
--   openssl rsa -in ava_reader_key.p8 -pubout -out ava_reader_key.pub
USE ROLE ACCOUNTADMIN;

-- An X-Small warehouse (1 credit/hour, suspended after 60 s idle) capped at 20 credits per month.
CREATE RESOURCE MONITOR IF NOT EXISTS AVA_MONITOR
  WITH CREDIT_QUOTA = 20 FREQUENCY = MONTHLY START_TIMESTAMP = IMMEDIATELY
  TRIGGERS ON 80 PERCENT DO NOTIFY
           ON 100 PERCENT DO SUSPEND_IMMEDIATE;

CREATE WAREHOUSE IF NOT EXISTS AVA_WH
  WAREHOUSE_SIZE = XSMALL
  AUTO_SUSPEND = 60
  AUTO_RESUME = TRUE
  INITIALLY_SUSPENDED = TRUE
  COMMENT = 'AVA verification warehouse'
  STATEMENT_TIMEOUT_IN_SECONDS = 600;
ALTER WAREHOUSE AVA_WH SET RESOURCE_MONITOR = AVA_MONITOR;

-- AVA connects as AVA_READER (read-only); AVA_OWNER only owns the AVA_TEST fixtures.
CREATE ROLE IF NOT EXISTS AVA_READER COMMENT = 'Read-only role used by AVA';
CREATE ROLE IF NOT EXISTS AVA_OWNER COMMENT = 'Owns the AVA_TEST fixture database';
GRANT ROLE AVA_READER TO ROLE SYSADMIN;
GRANT ROLE AVA_OWNER TO ROLE SYSADMIN;
GRANT USAGE ON WAREHOUSE AVA_WH TO ROLE AVA_READER;
GRANT USAGE ON WAREHOUSE AVA_WH TO ROLE AVA_OWNER;

-- init.sql (run as AVA_OWNER) creates the fixtures and grants AVA_READER read access to one schema.
CREATE DATABASE IF NOT EXISTS AVA_TEST COMMENT = 'AVA Snowflake source fixtures';
GRANT OWNERSHIP ON DATABASE AVA_TEST TO ROLE AVA_OWNER COPY CURRENT GRANTS;
GRANT OWNERSHIP ON SCHEMA AVA_TEST.PUBLIC TO ROLE AVA_OWNER COPY CURRENT GRANTS;

-- Service users authenticate with key pairs: no password and no MFA prompt.
CREATE USER IF NOT EXISTS AVA_READER_SVC
  TYPE = SERVICE
  DEFAULT_ROLE = AVA_READER
  DEFAULT_WAREHOUSE = AVA_WH
  COMMENT = 'AVA read-only analysis user';
ALTER USER AVA_READER_SVC SET RSA_PUBLIC_KEY = '<READER_PUBLIC_KEY>';
GRANT ROLE AVA_READER TO USER AVA_READER_SVC;

CREATE USER IF NOT EXISTS AVA_OWNER_SVC
  TYPE = SERVICE
  DEFAULT_ROLE = AVA_OWNER
  DEFAULT_WAREHOUSE = AVA_WH
  COMMENT = 'Creates the AVA_TEST fixtures';
ALTER USER AVA_OWNER_SVC SET RSA_PUBLIC_KEY = '<OWNER_PUBLIC_KEY>';
GRANT ROLE AVA_OWNER TO USER AVA_OWNER_SVC;

-- Snowflake's shared TPC-H sample data, used by the end-to-end analysis cases.
CREATE DATABASE IF NOT EXISTS SNOWFLAKE_SAMPLE_DATA FROM SHARE SFC_SAMPLES.SAMPLE_DATA;
GRANT IMPORTED PRIVILEGES ON DATABASE SNOWFLAKE_SAMPLE_DATA TO ROLE AVA_READER;

-- Check: both service users exist with has_rsa_public_key = true. Export the account identifier,
-- SELECT CURRENT_ORGANIZATION_NAME() || '-' || CURRENT_ACCOUNT_NAME(), as AVA_SNOWFLAKE_ACCOUNT.
SHOW USERS LIKE 'AVA_%';
