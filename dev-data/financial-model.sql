-- One row per delivered fulfillment; aggregate refund applications before joining.
WITH refunds AS (
  SELECT fulfillment_id,
         SUM(refund_customer_cents + clawback_subsidy_cents) AS refund_cents,
         SUM(CASE WHEN restocked_at <= '2026-10-18 23:59:59'
                  THEN restocked_quantity ELSE 0 END) AS restocked_quantity
  FROM refund_requests
  WHERE status = 'completed' AND completed_at <= '2026-10-18 23:59:59'
    AND fulfillment_id IS NOT NULL
  GROUP BY fulfillment_id
), settlement AS (
  SELECT f.fulfillment_id, o.order_id, i.order_item_id, o.customer_id,
         o.market_id, m.market_name, o.sales_store_id, s.store_name,
         s.region AS selling_region, s.city AS selling_city,
         f.fulfillment_store_id, i.product_id, p.sku, p.product_name, p.category,
         o.acquisition_channel_id, ch.channel_name, ch.channel_type,
         o.acquisition_campaign_id, o.sales_channel, t.revenue_mode,
         t.commission_bps, f.purchase_order_id, po.lot_code,
         SUBSTR(o.paid_at, 1, 10) AS paid_date,
         SUBSTR(f.delivered_at, 1, 10) AS delivered_date,
         CASE WHEN SUBSTR(o.paid_at, 1, 10) = SUBSTR(c.first_paid_at, 1, 10)
              THEN 'new' ELSE 'returning' END AS customer_type,
         f.quantity AS delivered_quantity,
         f.quantity * (i.unit_customer_paid_cents + i.unit_platform_subsidy_cents)
           AS gross_settlement_cents,
         COALESCE(r.refund_cents, 0) AS refund_cents,
         CASE WHEN t.revenue_mode = 'owned'
              THEN (f.quantity - COALESCE(r.restocked_quantity, 0)) * po.unit_cost_cents
              ELSE 0 END AS net_cogs_cents,
         f.fulfillment_cost_cents, f.payment_fee_cents
  FROM fulfillments f
  JOIN order_items i ON i.order_item_id = f.order_item_id
  JOIN orders o ON o.order_id = i.order_id
  JOIN products p ON p.product_id = i.product_id
  JOIN commercial_terms t ON t.term_id = i.term_id
  JOIN purchase_orders po ON po.purchase_order_id = f.purchase_order_id
  JOIN stores s ON s.store_id = o.sales_store_id
  JOIN markets m ON m.market_id = o.market_id
  JOIN channels ch ON ch.channel_id = o.acquisition_channel_id
  JOIN customers c ON c.customer_id = o.customer_id
  LEFT JOIN refunds r ON r.fulfillment_id = f.fulfillment_id
  WHERE o.order_kind = 'customer_sale' AND o.paid_at IS NOT NULL
    AND o.status IN ('paid', 'completed')
    AND f.delivered_at IS NOT NULL AND f.delivered_at <= '2026-10-18 23:59:59'
), revenue AS (
  SELECT *, CAST(ROUND((gross_settlement_cents - refund_cents) *
                 CASE WHEN revenue_mode = 'consignment' THEN commission_bps / 10000.0
                      ELSE 1.0 END, 0) AS BIGINT) AS net_sales_cents
  FROM settlement
)
SELECT *, net_sales_cents - net_cogs_cents AS gross_profit_cents,
       net_sales_cents - net_cogs_cents - fulfillment_cost_cents - payment_fee_cents
         AS contribution_before_ads_cents
FROM revenue
