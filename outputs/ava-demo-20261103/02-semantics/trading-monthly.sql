SELECT strftime(paid_at, '%Y-%m') AS month, SUM(CASE WHEN order_kind='customer_sale' AND status IN ('completed','shipped','paid') THEN (CAST(line_paid_amount AS DECIMAL(18,2))-COALESCE(CAST(refund_amount AS DECIMAL(18,2)),0)) ELSE 0 END) AS amount
FROM data WHERE paid_at >= DATE '2026-08-01' AND paid_at < DATE '2026-10-01' GROUP BY month ORDER BY month;
