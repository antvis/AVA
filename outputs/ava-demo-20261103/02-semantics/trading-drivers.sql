WITH monthly AS (
 SELECT selling_store_name, channel, product_name,
 strftime(paid_at, '%Y-%m') AS month, SUM(CASE WHEN order_kind='customer_sale' AND status IN ('completed','shipped','paid') THEN (CAST(line_paid_amount AS DECIMAL(18,2))-COALESCE(CAST(refund_amount AS DECIMAL(18,2)),0)) ELSE 0 END) AS amount
 FROM data WHERE paid_at >= DATE '2026-08-01' AND paid_at < DATE '2026-10-01'
 GROUP BY selling_store_name, channel, product_name, month
), changes AS (
 SELECT selling_store_name, channel, product_name,
 SUM(CASE WHEN month='2026-08' THEN amount ELSE 0 END) AS august,
 SUM(CASE WHEN month='2026-09' THEN amount ELSE 0 END) AS september,
 september-august AS change
 FROM monthly GROUP BY selling_store_name, channel, product_name
)
SELECT * FROM changes ORDER BY change, selling_store_name, channel, product_name;
