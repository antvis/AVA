type Point = { lag: number; value: number | null; lower: number | null; upper: number | null };
const normal95 = 1.959963984540054;

export function autocorrelationSql(table: string, value: string, lags: number, orderBy?: string): string {
  const order = orderBy === undefined ? '' : 'ORDER BY series_order NULLS LAST';
  const projection = ['series_value', 'favg(series_value) OVER () AS center'];
  const covariance = ['fsum((series_value - center) * (series_value - center))'];
  for (let lag = 1; lag <= lags; lag += 1) {
    projection.push(`lag(series_value, ${lag}) OVER (${order}) AS lag${lag}`);
    covariance.push(`fsum((series_value - center) * (lag${lag} - center))`);
  }
  return `first((SELECT struct_pack(count := count(*)::DOUBLE, covariance := [${covariance.join(', ')}])
    FROM (SELECT ${projection.join(', ')} FROM (SELECT ${value} AS series_value
      ${orderBy === undefined ? '' : `, ${orderBy} AS series_order`} FROM ${table}
      WHERE isfinite(${value})) observations) lags))`;
}

function point(lag: number, value: number | null, halfWidth: number): Point {
  return {
    lag,
    value,
    lower: value === null ? null : value - halfWidth,
    upper: value === null ? null : value + halfWidth,
  };
}

export function autocorrelationResult({ count, covariance }: { count: number; covariance: (number | null)[] }) {
  const acf: Point[] = [];
  const pacf: Point[] = [];
  if (!count) return { count, acf, pacf };
  const limit = Math.min(covariance.length - 1, Math.max(0, Math.floor(count / 2) - 1));
  const denominator = covariance[0];
  const correlations = covariance
    .slice(0, limit + 1)
    .map((value) =>
      denominator && Number.isFinite(denominator) && value !== null && Number.isFinite(value)
        ? value / denominator
        : null
    );
  const baseWidth = normal95 / Math.sqrt(count);
  let varianceFactor = 1;
  let residual = 1;
  let coefficients: number[] = [];
  acf.push(point(0, correlations[0], 0));
  pacf.push(point(0, 1, 0));
  for (let lag = 1; lag <= limit; lag += 1) {
    const value = correlations[lag];
    acf.push(point(lag, value, baseWidth * Math.sqrt(varianceFactor)));
    varianceFactor += 2 * (value ?? 0) ** 2;
    // The Durbin–Levinson recursion solves the unadjusted Yule–Walker equations.
    const estimate =
      value === null || residual <= 0
        ? null
        : (value - coefficients.reduce((sum, previous, i) => sum + previous * correlations[lag - i - 1]!, 0)) /
          residual;
    pacf.push(point(lag, estimate, baseWidth));
    if (estimate !== null) {
      coefficients = coefficients.map((value, i) => value - estimate * coefficients[coefficients.length - i - 1]);
      coefficients.push(estimate);
      residual *= 1 - estimate ** 2;
    }
  }
  return { count, acf, pacf };
}
