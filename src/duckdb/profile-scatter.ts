import { sqlStringLiteral } from '../util/sql';

function normalized(value: string, low: string, high: string): string {
  return `CASE WHEN ${high} = ${low} THEN 0.5
    WHEN isfinite(${high} - ${low}) THEN (${value} - ${low}) / (${high} - ${low})
    ELSE (${value} / 2 - ${low} / 2) / (${high} / 2 - ${low} / 2) END`;
}

export function scatterPairSql(
  source: string,
  left: { name: string; alias: string },
  right: { name: string; alias: string },
  threshold: number,
  grid: number
): string {
  const x = `(${normalized('x', 'x_min', 'x_max')}) * ${grid}`;
  const y = `(1 - (${normalized('y', 'y_min', 'y_max')})) * ${grid} * 2 / 3`;
  return `WITH paired AS NOT MATERIALIZED (
    SELECT ${left.alias} AS x, ${right.alias} AS y, position FROM ${source}
    WHERE isfinite(${left.alias}) AND isfinite(${right.alias})
  ), bounds AS (
    SELECT count(*)::DOUBLE AS n, min(x) AS x_min, max(x) AS x_max, min(y) AS y_min, max(y) AS y_max FROM paired
  ), coordinates AS (
    SELECT hx - hy / sqrt(3) AS q, 2 * hy / sqrt(3) AS r
    FROM (SELECT ${x} AS hx, ${y} AS hy FROM paired CROSS JOIN bounds WHERE n > ${threshold}) axes
  ), rounded AS (
    SELECT round_even(q, 0) AS q1, round_even(-q-r, 0) AS s1, round_even(r, 0) AS r1,
      abs(q1-q) AS dq, abs(s1+q+r) AS ds, abs(r1-r) AS dr FROM coordinates
  ), bins AS (
    SELECT CASE WHEN dq > ds AND dq > dr THEN -s1-r1 ELSE q1 END AS q,
      CASE WHEN (dq > ds AND dq > dr) OR ds > dr THEN r1 ELSE -q1-s1 END AS r,
      count(*)::DOUBLE AS count FROM rounded GROUP BY 1, 2
  ) SELECT struct_pack(x_column := ${sqlStringLiteral(left.name)}, y_column := ${sqlStringLiteral(right.name)},
    count := n, x_min := x_min, x_max := x_max, y_min := y_min, y_max := y_max, gridsize := ${grid},
    points := coalesce((SELECT list(struct_pack(x := x, y := y) ORDER BY position)
      FROM paired CROSS JOIN bounds WHERE n <= ${threshold}), []),
    hexagons := coalesce((SELECT list(struct_pack(x := (q + r / 2) / ${grid},
      y := 1 - r * sqrt(3) * 3 / (4 * ${grid}), count := count) ORDER BY q, r) FROM bins), []))
  FROM bounds`;
}
