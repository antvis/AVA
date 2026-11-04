WITH lags AS (SELECT * FROM (VALUES (0),(1),(3),(7)) t(lag))
SELECT CASE WHEN CAST(registered_at AS DATE) BETWEEN DATE '2026-07-01' AND DATE '2026-07-14' THEN '前期' ELSE '近期' END AS period, l.lag,
 COUNT(DISTINCT u.user_id) AS new_users, COUNT(DISTINCT e.user_id) AS retained_users,
 100.0*COUNT(DISTINCT e.user_id)/COUNT(DISTINCT u.user_id) AS retained_pct
FROM users u CROSS JOIN lags l LEFT JOIN events e ON u.user_id=e.user_id
 AND date_diff('day',CAST(u.registered_at AS DATE),CAST(e.event_date AS DATE))=l.lag
 AND e.event_name='core_action'
WHERE (CAST(registered_at AS DATE) BETWEEN DATE '2026-07-01' AND DATE '2026-07-14' OR CAST(registered_at AS DATE) BETWEEN DATE '2026-07-22' AND DATE '2026-08-04') GROUP BY period,l.lag ORDER BY period,l.lag;
