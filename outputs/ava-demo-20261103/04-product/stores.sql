WITH monthly AS (
 SELECT selling_store_name, channel, product_name,
 strftime(completed_at, '%Y-%m') AS month, SUM(CASE WHEN order_kind='customer_sale' AND status IN ('completed') THEN (ROUND(CAST(line_paid_amount AS DECIMAL(18,2))*CAST(commission_rate AS DECIMAL(6,4)),2)-ROUND(COALESCE(CAST(refund_amount AS DECIMAL(18,2)),0)*CAST(commission_rate AS DECIMAL(6,4)),2)) ELSE 0 END) AS amount
 FROM data WHERE completed_at >= DATE '2026-08-01' AND completed_at < DATE '2026-10-01'
 GROUP BY selling_store_name, channel, product_name, month
), changes AS (
 SELECT selling_store_name, channel, product_name,
 SUM(CASE WHEN month='2026-08' THEN amount ELSE 0 END) AS august,
 SUM(CASE WHEN month='2026-09' THEN amount ELSE 0 END) AS september,
 september-august AS change
 FROM monthly GROUP BY selling_store_name, channel, product_name
)
SELECT selling_store_name, SUM(august) AS august, SUM(september) AS september,
 SUM(change) AS change FROM changes GROUP BY selling_store_name
 ORDER BY change, selling_store_name;
