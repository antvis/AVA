SELECT CASE WHEN CAST(registered_at AS DATE) BETWEEN DATE '2026-07-01' AND DATE '2026-07-14' THEN '前期' ELSE '近期' END AS period, u.channel, COUNT(DISTINCT u.user_id) AS new_users,
 COUNT(DISTINCT e.user_id) AS d7_users,
 100.0*COUNT(DISTINCT e.user_id)/COUNT(DISTINCT u.user_id) AS d7_pct
FROM users u LEFT JOIN events e ON u.user_id=e.user_id
 AND CAST(e.event_date AS DATE)=CAST(u.registered_at AS DATE)+INTERVAL 7 DAY
 AND e.event_name='core_action'
WHERE (CAST(registered_at AS DATE) BETWEEN DATE '2026-07-01' AND DATE '2026-07-14' OR CAST(registered_at AS DATE) BETWEEN DATE '2026-07-22' AND DATE '2026-08-04') GROUP BY period, u.channel ORDER BY period, u.channel;
