PRAGMA foreign_keys = ON;

CREATE TABLE stores (
  store_id INTEGER PRIMARY KEY,
  store_name TEXT NOT NULL,
  region TEXT NOT NULL,
  city TEXT NOT NULL
);

CREATE TABLE markets (
  market_id INTEGER PRIMARY KEY,
  market_name TEXT NOT NULL UNIQUE,
  region TEXT NOT NULL,
  serving_store_id INTEGER NOT NULL REFERENCES stores(store_id)
);

CREATE TABLE channels (
  channel_id INTEGER PRIMARY KEY,
  channel_name TEXT NOT NULL,
  channel_type TEXT NOT NULL CHECK (channel_type IN ('organic', 'direct', 'paid', 'offline'))
);

CREATE TABLE products (
  product_id INTEGER PRIMARY KEY,
  sku TEXT NOT NULL UNIQUE,
  product_name TEXT NOT NULL,
  category TEXT NOT NULL,
  list_price_cents INTEGER NOT NULL CHECK (list_price_cents > 0)
);

CREATE TABLE commercial_terms (
  term_id INTEGER PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(product_id),
  valid_from TEXT NOT NULL,
  valid_to TEXT NOT NULL,
  revenue_mode TEXT NOT NULL CHECK (revenue_mode IN ('owned', 'consignment')),
  commission_bps INTEGER NOT NULL CHECK (commission_bps BETWEEN 1 AND 10000),
  supplier_name TEXT NOT NULL,
  CHECK (valid_from <= valid_to)
);

CREATE TABLE customers (
  customer_id INTEGER PRIMARY KEY,
  market_id INTEGER NOT NULL REFERENCES markets(market_id),
  registered_at TEXT NOT NULL,
  first_paid_at TEXT,
  acquisition_channel_id INTEGER NOT NULL REFERENCES channels(channel_id)
);

CREATE TABLE campaigns (
  campaign_id INTEGER PRIMARY KEY,
  campaign_name TEXT NOT NULL,
  channel_id INTEGER NOT NULL REFERENCES channels(channel_id),
  active_from TEXT NOT NULL,
  active_to TEXT NOT NULL,
  attribution_window_days INTEGER NOT NULL,
  attribution_method TEXT NOT NULL,
  target_audience TEXT NOT NULL
);

CREATE TABLE experiments (
  experiment_id INTEGER PRIMARY KEY,
  experiment_name TEXT NOT NULL,
  campaign_id INTEGER NOT NULL REFERENCES campaigns(campaign_id),
  randomization_unit TEXT NOT NULL,
  assignment_method TEXT NOT NULL,
  pre_start TEXT NOT NULL,
  pre_end TEXT NOT NULL,
  test_start TEXT NOT NULL,
  test_end TEXT NOT NULL,
  treatment_description TEXT NOT NULL
);

CREATE TABLE experiment_assignments (
  experiment_id INTEGER NOT NULL REFERENCES experiments(experiment_id),
  market_id INTEGER NOT NULL REFERENCES markets(market_id),
  stratum TEXT NOT NULL,
  assigned_group TEXT NOT NULL CHECK (assigned_group IN ('control', 'treatment')),
  assigned_at TEXT NOT NULL,
  PRIMARY KEY (experiment_id, market_id)
);

CREATE TABLE purchase_orders (
  purchase_order_id INTEGER PRIMARY KEY,
  store_id INTEGER NOT NULL REFERENCES stores(store_id),
  product_id INTEGER NOT NULL REFERENCES products(product_id),
  ordered_at TEXT NOT NULL,
  expected_at TEXT NOT NULL,
  received_at TEXT,
  ordered_quantity INTEGER NOT NULL CHECK (ordered_quantity > 0),
  received_quantity INTEGER NOT NULL CHECK (received_quantity >= 0 AND received_quantity <= ordered_quantity),
  unit_cost_cents INTEGER NOT NULL CHECK (unit_cost_cents >= 0),
  lot_code TEXT NOT NULL,
  delay_reason TEXT,
  CHECK (received_at IS NOT NULL OR received_quantity = 0)
);

CREATE TABLE orders (
  order_id INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(customer_id),
  sales_store_id INTEGER NOT NULL REFERENCES stores(store_id),
  market_id INTEGER NOT NULL REFERENCES markets(market_id),
  acquisition_channel_id INTEGER NOT NULL REFERENCES channels(channel_id),
  acquisition_campaign_id INTEGER REFERENCES campaigns(campaign_id),
  sales_channel TEXT NOT NULL,
  order_kind TEXT NOT NULL CHECK (order_kind IN ('customer_sale', 'employee', 'gift', 'test')),
  status TEXT NOT NULL CHECK (status IN ('pending_payment', 'cancelled', 'paid', 'completed')),
  ordered_at TEXT NOT NULL,
  paid_at TEXT,
  merchandise_paid_cents INTEGER NOT NULL CHECK (merchandise_paid_cents >= 0),
  freight_paid_cents INTEGER NOT NULL CHECK (freight_paid_cents >= 0)
);

CREATE TABLE order_items (
  order_item_id INTEGER PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(order_id),
  product_id INTEGER NOT NULL REFERENCES products(product_id),
  term_id INTEGER NOT NULL REFERENCES commercial_terms(term_id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_list_price_cents INTEGER NOT NULL CHECK (unit_list_price_cents > 0),
  unit_discount_cents INTEGER NOT NULL CHECK (unit_discount_cents >= 0),
  unit_customer_paid_cents INTEGER NOT NULL CHECK (unit_customer_paid_cents >= 0),
  unit_platform_subsidy_cents INTEGER NOT NULL CHECK (unit_platform_subsidy_cents >= 0),
  CHECK (unit_customer_paid_cents = unit_list_price_cents - unit_discount_cents)
);

CREATE TABLE fulfillments (
  fulfillment_id INTEGER PRIMARY KEY,
  order_item_id INTEGER NOT NULL REFERENCES order_items(order_item_id),
  fulfillment_store_id INTEGER NOT NULL REFERENCES stores(store_id),
  purchase_order_id INTEGER NOT NULL REFERENCES purchase_orders(purchase_order_id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  shipped_at TEXT NOT NULL,
  delivered_at TEXT,
  carrier TEXT NOT NULL,
  fulfillment_cost_cents INTEGER NOT NULL CHECK (fulfillment_cost_cents >= 0),
  payment_fee_cents INTEGER NOT NULL CHECK (payment_fee_cents >= 0)
);

CREATE TABLE refund_requests (
  refund_id INTEGER PRIMARY KEY,
  order_item_id INTEGER NOT NULL REFERENCES order_items(order_item_id),
  fulfillment_id INTEGER REFERENCES fulfillments(fulfillment_id),
  requested_at TEXT NOT NULL,
  completed_at TEXT,
  status TEXT NOT NULL CHECK (status IN ('requested', 'approved', 'completed', 'rejected')),
  refund_customer_cents INTEGER NOT NULL CHECK (refund_customer_cents >= 0),
  clawback_subsidy_cents INTEGER NOT NULL CHECK (clawback_subsidy_cents >= 0),
  returned_quantity INTEGER NOT NULL CHECK (returned_quantity >= 0),
  restocked_quantity INTEGER NOT NULL CHECK (restocked_quantity BETWEEN 0 AND returned_quantity),
  restocked_at TEXT,
  reason_code TEXT NOT NULL,
  CHECK ((status = 'completed') = (completed_at IS NOT NULL)),
  CHECK (restocked_quantity = 0 OR restocked_at IS NOT NULL)
);

CREATE TABLE order_touches (
  touch_id INTEGER PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(order_id),
  campaign_id INTEGER NOT NULL REFERENCES campaigns(campaign_id),
  touched_at TEXT NOT NULL,
  touch_type TEXT NOT NULL CHECK (touch_type IN ('click', 'view'))
);

CREATE TABLE ad_daily (
  day TEXT NOT NULL,
  campaign_id INTEGER NOT NULL REFERENCES campaigns(campaign_id),
  market_id INTEGER NOT NULL REFERENCES markets(market_id),
  impressions INTEGER NOT NULL CHECK (impressions >= 0),
  clicks INTEGER NOT NULL CHECK (clicks BETWEEN 0 AND impressions),
  spend_cents INTEGER NOT NULL CHECK (spend_cents >= 0),
  platform_reported_orders INTEGER NOT NULL CHECK (platform_reported_orders >= 0),
  platform_reported_value_cents INTEGER NOT NULL CHECK (platform_reported_value_cents >= 0),
  PRIMARY KEY (day, campaign_id, market_id)
);

CREATE TABLE traffic_daily (
  day TEXT NOT NULL,
  market_id INTEGER NOT NULL REFERENCES markets(market_id),
  channel_id INTEGER NOT NULL REFERENCES channels(channel_id),
  product_id INTEGER NOT NULL REFERENCES products(product_id),
  product_views INTEGER NOT NULL CHECK (product_views > 0),
  add_to_carts INTEGER NOT NULL CHECK (add_to_carts BETWEEN 0 AND product_views),
  checkout_starts INTEGER NOT NULL CHECK (checkout_starts BETWEEN 0 AND add_to_carts),
  orders_created INTEGER NOT NULL CHECK (orders_created BETWEEN 0 AND checkout_starts),
  out_of_stock_views INTEGER NOT NULL CHECK (out_of_stock_views BETWEEN 0 AND product_views),
  PRIMARY KEY (day, market_id, channel_id, product_id)
);

CREATE TABLE inventory_daily (
  day TEXT NOT NULL,
  store_id INTEGER NOT NULL REFERENCES stores(store_id),
  product_id INTEGER NOT NULL REFERENCES products(product_id),
  opening_quantity INTEGER NOT NULL CHECK (opening_quantity >= 0),
  received_quantity INTEGER NOT NULL CHECK (received_quantity >= 0),
  shipped_quantity INTEGER NOT NULL CHECK (shipped_quantity >= 0),
  restocked_quantity INTEGER NOT NULL CHECK (restocked_quantity >= 0),
  closing_quantity INTEGER NOT NULL CHECK (closing_quantity >= 0),
  PRIMARY KEY (day, store_id, product_id),
  CHECK (closing_quantity = opening_quantity + received_quantity + restocked_quantity - shipped_quantity)
);

CREATE INDEX idx_orders_paid ON orders(paid_at);
CREATE INDEX idx_orders_market ON orders(market_id, acquisition_channel_id);
CREATE INDEX idx_items_order ON order_items(order_id);
CREATE INDEX idx_items_product ON order_items(product_id);
CREATE INDEX idx_fulfillments_item ON fulfillments(order_item_id);
CREATE INDEX idx_fulfillments_delivered ON fulfillments(delivered_at);
CREATE INDEX idx_fulfillments_purchase ON fulfillments(purchase_order_id);
CREATE INDEX idx_refunds_fulfillment ON refund_requests(fulfillment_id);
CREATE INDEX idx_refunds_item ON refund_requests(order_item_id);
CREATE INDEX idx_touches_order ON order_touches(order_id);
CREATE INDEX idx_touches_campaign ON order_touches(campaign_id, touched_at);
CREATE INDEX idx_inventory_product ON inventory_daily(product_id, day, store_id);
CREATE INDEX idx_traffic_product ON traffic_daily(product_id, day, channel_id);
