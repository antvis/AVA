export function timeGapsSql(table: string, observed: string, index: string): string {
  return `first((SELECT struct_pack(
    n_gaps := count(*)::DOUBLE,
    min := coalesce(min(gap), 0), max := coalesce(max(gap), 0),
    mean := coalesce(avg(gap), 0), std := coalesce(stddev_samp(gap), 0),
    gaps := coalesce(list([previous, position] ORDER BY position), []))
  FROM (
    SELECT *, avg(gap) FILTER (WHERE gap > 0) OVER () AS typical FROM (
      SELECT position, previous, position - previous AS gap FROM (
        SELECT position, lag(position) OVER (ORDER BY position) AS previous FROM (
          SELECT (${index})::DOUBLE AS position, ${observed} AS observed FROM ${table}
        ) indexed WHERE observed AND isfinite(position)
      ) ordered
    ) intervals
  ) distances WHERE gap > 2 * typical))`;
}
