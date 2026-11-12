export function chiSquareBins(lo: string, hi: string, count: string, quartiles: string, integral: boolean): string {
  const span = `(${hi} - ${lo})`;
  const sturges = `${span} / (log2(NULLIF(${count}, 0)) + 1)`;
  const fd = `2 * (${quartiles}[2] - ${quartiles}[1]) * pow(${count}::DOUBLE, -1.0 / 3)`;
  const width = `least(${sturges}, NULLIF(${fd}, 0))`;
  return `CASE WHEN ${lo} IS NULL OR ${span} = 0 THEN 1
    ELSE ceil(${span} / ${integral ? `greatest(1, ${width})` : `(${width})`})::BIGINT END`;
}

export function chiSquareCounts(value: string, lo: string, hi: string, bins: string): string {
  const span = `(${hi} - ${lo})`;
  const width = `(${span} / ${bins})`;
  const candidate = `least(${bins} - 1, trunc((${value} - ${lo}) / ${span} * ${bins})::BIGINT)`;
  // Correct boundary rounding against the same equally spaced edges as NumPy.
  const bucket = `CASE WHEN NOT isfinite(${value}) THEN NULL WHEN ${bins} = 1 THEN 0 ELSE list_transform([${candidate}], lambda i:
    i + CASE WHEN ${value} < ${lo} + ${width} * i THEN -1
      WHEN i < ${bins} - 1 AND ${value} >= ${lo} + ${width} * (i + 1) THEN 1 ELSE 0 END)[1] END`;
  return `map_values(histogram(${bucket}) FILTER (WHERE isfinite(${value})))`;
}

export function chiSquareSql(counts: string, bins?: string): string {
  return `list_transform([${counts}], lambda counts:
    list_transform([struct_pack(n := ${bins ? `first(${bins})` : 'len(counts)'}, total := list_sum(counts)::DOUBLE)],
    lambda data: CASE WHEN coalesce(data.total, 0) = 0 THEN struct_pack(statistic := 0.0::DOUBLE, df := -1.0::DOUBLE, log_gamma := NULL::DOUBLE)
      ELSE list_transform([data.total / data.n], lambda expected: struct_pack(
        statistic := list_aggregate(list_transform(counts, lambda c: pow(c - expected, 2) / expected), 'fsum')
          + (data.n - len(counts)) * expected,
        df := (data.n - 1)::DOUBLE,
        log_gamma := CASE WHEN data.n > 1 THEN lgamma((data.n - 1) / 2.0) END))[1] END)[1])[1]`;
}

// Regularized upper incomplete gamma, using the series below a+1 and a continued fraction above it.
function gammaSurvival(a: number, x: number, logGamma: number): number {
  if (x === 0) return 1;
  const scale = Math.exp(a * Math.log(x) - x - logGamma);
  const tolerance = 2e-15;
  if (x < a + 1) {
    let term = 1 / a;
    let sum = term;
    for (let i = 1; i <= 100_000; i += 1) {
      term *= x / (a + i);
      sum += term;
      if (term <= sum * tolerance) return Math.max(0, 1 - scale * sum);
    }
  } else {
    const tiny = 1e-300;
    const clamp = (v: number) => (Math.abs(v) < tiny ? tiny : v);
    let b = x + 1 - a;
    let c = 1 / tiny;
    let d = 1 / b;
    let fraction = d;
    for (let i = 1; i <= 100_000; i += 1) {
      const numerator = i * (a - i);
      b += 2;
      c = clamp(b + numerator / c);
      d = 1 / clamp(b + numerator * d);
      const change = c * d;
      fraction *= change;
      if (Math.abs(change - 1) <= tolerance) return Math.min(1, scale * fraction);
    }
  }
  throw new Error('Chi-square survival probability did not converge');
}

export function chiSquareResult(raw: { statistic: number; df: number; log_gamma: number }) {
  const { statistic, df, log_gamma: logGamma } = raw;
  return { statistic, pvalue: df < 0 ? 0 : df === 0 ? null : gammaSurvival(df / 2, statistic / 2, logGamma) };
}
