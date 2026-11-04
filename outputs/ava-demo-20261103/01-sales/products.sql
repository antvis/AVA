SELECT product,
  SUM(CASE WHEN month='2025-01' THEN revenue ELSE 0 END) AS january,
  SUM(CASE WHEN month='2025-02' THEN revenue ELSE 0 END) AS february,
  february-january AS change
FROM data WHERE month IN ('2025-01','2025-02')
GROUP BY product ORDER BY change DESC, product;
