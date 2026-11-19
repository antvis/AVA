/** Kendall tau-b from grouped observations. Each unequal rank pair is counted at its highest differing bit. */
export function kendallPair(input: string, left: string, right: string): string {
  return `WITH points AS (
    SELECT ${left} AS x, ${right} AS y, count(*) AS weight FROM ${input}
    WHERE isfinite(${left}) AND isfinite(${right}) GROUP BY 1, 2
  ), ranked AS MATERIALIZED (
    SELECT x, weight, dense_rank() OVER (ORDER BY y) - 1 AS y_rank,
      sum(weight) OVER (PARTITION BY x) AS x_count,
      sum(weight) OVER (PARTITION BY y) AS y_count
    FROM points
  ), totals AS (
    SELECT sum(weight) AS n,
      sum(weight * (x_count - 1)) // 2 AS x_ties,
      sum(weight * (y_count - 1)) // 2 AS y_ties,
      COALESCE(floor(log2(NULLIF(max(y_rank), 0))) + 1, 0)::BIGINT AS bit_count
    FROM ranked
  ), branches AS (
    SELECT x, weight, bit, y_rank >> (bit + 1) AS parent, (y_rank >> bit) & 1 AS side
    FROM ranked CROSS JOIN totals CROSS JOIN unnest(range(bit_count)) bits(bit)
  ), ordered AS (
    SELECT weight, side,
      sum(weight) FILTER (WHERE side = 0) OVER prior_x AS lower_count,
      sum(weight) FILTER (WHERE side = 1) OVER prior_x AS upper_count
    FROM branches
    WINDOW prior_x AS (PARTITION BY bit, parent ORDER BY x GROUPS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING)
  )
  SELECT (SELECT sum(weight * CASE WHEN side = 1 THEN COALESCE(lower_count, 0) ELSE -COALESCE(upper_count, 0) END)
    FROM ordered)::DOUBLE / NULLIF(sqrt((n * (n - 1) // 2 - x_ties)::DOUBLE *
      (n * (n - 1) // 2 - y_ties)::DOUBLE), 0)
  FROM totals`;
}
