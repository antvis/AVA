export function referenceQuantiles(column: string, probabilities: string): string {
  const observations = `struct_pack(n := count(${column}),
    below := count(*) FILTER (WHERE ${column} = '-Infinity'::DOUBLE),
    above := count(*) FILTER (WHERE ${column} = 'Infinity'::DOUBLE),
    q := quantile_cont(${column}, ${probabilities}))`;
  // NumPy interpolates using both neighbours even when the fractional part is zero.
  return `list_transform([${observations}], lambda s:
    list_transform(list_zip(${probabilities}::DOUBLE[], s.q), lambda pair:
      list_transform([(s.n - 1) * pair[1]], lambda position:
        struct_pack(probability := pair[1], value := CASE
          WHEN floor(position) < s.below THEN
            CASE WHEN floor(position) + 1 = s.below AND s.below < s.n - s.above
              AND position - floor(position) >= 0.5 THEN '-Infinity'::DOUBLE END
          WHEN floor(position) >= s.n - s.above THEN NULL
          WHEN s.above > 0 AND floor(position) + 1 = s.n - s.above THEN
            CASE WHEN position - floor(position) > 0 AND position - floor(position) < 0.5 THEN 'Infinity'::DOUBLE END
          ELSE pair[2] END))[1]))[1]`;
}
