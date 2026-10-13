WITH monthly AS (
  SELECT
    product,
    SUM(CASE WHEN month = '2025-01' THEN revenue ELSE 0 END) AS january,
    SUM(CASE WHEN month = '2025-02' THEN revenue ELSE 0 END) AS february
  FROM data
  WHERE month IN ('2025-01', '2025-02')
  GROUP BY product
)
SELECT product, january, february, february - january AS change
FROM monthly
ORDER BY change DESC;
