/** Bias-corrected Cramér's V with Yates correction for 2 × 2 tables. */
export function cramersPair(input: string, left: string, right: string, active: string): string {
  return `WITH cells AS MATERIALIZED (
    SELECT ${left} AS x, ${right} AS y, count(*)::DOUBLE AS weight FROM ${input}
    WHERE ${left} IS NOT NULL AND ${right} IS NOT NULL AND ${active} GROUP BY 1, 2
  ), left_counts AS (SELECT x, sum(weight) AS nx FROM cells GROUP BY x),
  right_counts AS (SELECT y, sum(weight) AS ny FROM cells GROUP BY y),
  totals AS (
    SELECT COALESCE(sum(nx), 0) AS n, count(*)::DOUBLE AS r,
      (SELECT count(*)::DOUBLE FROM right_counts) AS k FROM left_counts
  ), statistics AS (
    SELECT n, r, k, CASE WHEN r = 2 AND k = 2 THEN (
      SELECT sum(pow(greatest(abs(COALESCE(weight, 0) - nx * ny / n) - 0.5, 0), 2) / (nx * ny / n))
      FROM left_counts CROSS JOIN right_counts LEFT JOIN cells USING (x, y)
      WHERE r = 2 AND k = 2
    ) ELSE (
      SELECT sum(weight * weight * n / (nx * ny)) - n
      FROM cells JOIN left_counts USING (x) JOIN right_counts USING (y)
    ) END AS chi_squared FROM totals
  ), corrected AS (
    SELECT n, greatest(0, chi_squared / n - (r - 1) * (k - 1) / (n - 1)) AS phi,
      least(r - 1 - pow(r - 1, 2) / (n - 1), k - 1 - pow(k - 1, 2) / (n - 1)) AS denominator
    FROM statistics WHERE n > 1
  )
  SELECT CASE WHEN denominator = 0 THEN 1 ELSE sqrt(phi / denominator) END FROM corrected`;
}
