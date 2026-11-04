WITH daily AS (
 SELECT CAST(event_date AS DATE) AS day, COUNT(DISTINCT user_id) AS dau
 FROM events WHERE event_name='core_action' GROUP BY day
)
SELECT CASE WHEN day BETWEEN DATE '2026-07-01' AND DATE '2026-07-14' THEN '前期' ELSE '近期' END AS period,
 AVG(dau) AS average_dau
FROM daily WHERE day BETWEEN DATE '2026-07-01' AND DATE '2026-07-14'
 OR day BETWEEN DATE '2026-07-22' AND DATE '2026-08-04' GROUP BY period;
