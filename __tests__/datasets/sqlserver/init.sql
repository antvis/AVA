:ON ERROR EXIT

-- Disposable test fixtures only. These passwords are not deployment credentials.
IF DB_ID(N'ava_sqlserver_test') IS NULL CREATE DATABASE ava_sqlserver_test;
GO
USE ava_sqlserver_test;
GO
IF OBJECT_ID(N'dbo.customers', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.customers (
    customer_id INT NOT NULL PRIMARY KEY,
    customer_name NVARCHAR(100) NOT NULL,
    region NVARCHAR(50) NULL
  );
  INSERT INTO dbo.customers VALUES (1,N'张三',N'华东'),(2,N'Alice',N'华南'),(3,N'李四',NULL);
END;
IF OBJECT_ID(N'dbo.orders', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.orders (
    order_id INT NOT NULL PRIMARY KEY,
    customer_id INT NOT NULL REFERENCES dbo.customers(customer_id),
    order_date DATE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    status NVARCHAR(20) NOT NULL
  );
  INSERT INTO dbo.orders VALUES
    (1001,1,'2025-01-05',100.50,N'paid'),
    (1002,1,'2025-01-15',200.00,N'paid'),
    (1003,2,'2025-01-20',150.25,N'paid'),
    (1004,2,'2025-02-01',300.00,N'paid'),
    (1005,3,'2025-02-10',50.75,N'cancelled'),
    (1006,1,'2025-02-20',80.00,N'paid');
END;
IF SCHEMA_ID(N'sales') IS NULL EXEC(N'CREATE SCHEMA sales');
IF OBJECT_ID(N'sales.orders', N'U') IS NULL
BEGIN
  CREATE TABLE sales.orders (order_id INT NOT NULL PRIMARY KEY, description NVARCHAR(50) NULL);
  INSERT INTO sales.orders VALUES (9001,N'另一 schema');
END;
GO
CREATE OR ALTER VIEW dbo.paid_orders AS
SELECT order_id, customer_id, order_date, amount FROM dbo.orders WHERE status = N'paid';
GO
USE master;
GO
IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name=N'ava_reader')
  CREATE LOGIN ava_reader WITH PASSWORD=N'Sql_fixture_2026!', CHECK_POLICY=ON, DEFAULT_DATABASE=ava_sqlserver_test;
GO
USE ava_sqlserver_test;
GO
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name=N'ava_reader')
  CREATE USER ava_reader FOR LOGIN ava_reader;
ALTER ROLE db_datareader ADD MEMBER ava_reader;
GRANT VIEW DEFINITION TO ava_reader;
DENY INSERT, UPDATE, DELETE, EXECUTE, ALTER ON DATABASE::ava_sqlserver_test TO ava_reader;
GO
