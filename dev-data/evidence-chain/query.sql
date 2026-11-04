SELECT
  period,
  SUM(net_sales_cents) / 100000.0
    AS net_sales_k
FROM data
WHERE channel = 'Organic search'
GROUP BY period
ORDER BY period;
