SELECT CAST(u.registered_at AS DATE) AS cohort_date, u.channel,
 COUNT(DISTINCT u.user_id) AS new_users, COUNT(DISTINCT e.user_id) AS d7_users,
 100.0*COUNT(DISTINCT e.user_id)/COUNT(DISTINCT u.user_id) AS d7_pct
FROM users u LEFT JOIN events e ON u.user_id=e.user_id
 AND CAST(e.event_date AS DATE)=CAST(u.registered_at AS DATE)+INTERVAL 7 DAY
 AND e.event_name='core_action'
WHERE CAST(u.registered_at AS DATE) BETWEEN DATE '2026-07-01' AND DATE '2026-08-04'
GROUP BY cohort_date,u.channel ORDER BY cohort_date,u.channel;
