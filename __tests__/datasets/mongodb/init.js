const database = db.getSiblingDB('ava_mongodb_test');

database.createUser({
  user: 'ava_test',
  pwd: 'ava_test_password',
  roles: [{ role: 'read', db: 'ava_mongodb_test' }],
});

database.createCollection('customers');
database.createCollection('orders');
database.createCollection('order notes');

database.customers.insertMany([
  {
    tenant_id: NumberInt(1),
    customer_id: NumberInt(101),
    name: 'Alice',
    email: 'alice@example.com',
    created_on: ISODate('2024-01-10T00:00:00Z'),
    profile: { tier: 'gold' },
  },
  {
    tenant_id: NumberInt(1),
    customer_id: NumberInt(102),
    name: 'Bob',
    email: null,
    created_on: ISODate('2024-02-20T00:00:00Z'),
    profile: null,
  },
  {
    tenant_id: NumberInt(2),
    customer_id: NumberInt(201),
    name: 'Carol',
    email: 'carol@example.com',
    created_on: ISODate('2024-02-20T00:00:00Z'),
    profile: { tier: 'silver' },
  },
]);

database.orders.insertMany([
  {
    order_id: NumberLong(1001),
    tenant_id: NumberInt(1),
    customer_id: NumberInt(101),
    amount: NumberDecimal('19.90'),
    status: 'paid',
    placed_at: ISODate('2024-03-01T09:00:00Z'),
    note: 'first order',
  },
  {
    order_id: NumberLong(1002),
    tenant_id: NumberInt(1),
    customer_id: NumberInt(101),
    amount: NumberDecimal('35.50'),
    status: 'pending',
    placed_at: ISODate('2024-03-02T10:30:00Z'),
    note: null,
  },
  {
    order_id: NumberLong(1003),
    tenant_id: NumberInt(1),
    customer_id: NumberInt(102),
    amount: NumberDecimal('10.00'),
    status: 'cancelled',
    placed_at: ISODate('2024-03-03T11:45:00Z'),
    note: 'customer cancelled',
  },
  {
    order_id: NumberLong(1004),
    tenant_id: NumberInt(2),
    customer_id: NumberInt(201),
    amount: NumberDecimal('34.60'),
    status: 'paid',
    placed_at: ISODate('2024-03-04T14:00:00Z'),
    note: null,
  },
]);

database.getCollection('order notes').insertMany([
  { order_id: NumberLong(1001), 'note"text': 'gift wrap' },
  { order_id: NumberLong(1002), 'note"text': null },
]);

database.customers.createIndex({ tenant_id: 1, customer_id: 1 }, { name: 'pk_customers', unique: true });
database.customers.createIndex({ tenant_id: 1, email: 1 }, { name: 'uq_customers_email', unique: true });
database.orders.createIndex({ order_id: 1 }, { name: 'pk_orders', unique: true });
database.orders.createIndex({ tenant_id: 1, customer_id: 1 }, { name: 'idx_orders_customer' });
database.orders.createIndex({ status: 1, placed_at: 1 }, { name: 'idx_orders_status_time' });
