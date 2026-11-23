import { gammaSurvival } from './profile-chi-square';

type LagSelection = 'AIC' | 'BIC' | 't-stat' | null;

function regression(level: number[], difference: number[], lag: number) {
  const width = lag + 2;
  const upper = Array.from({ length: width }, () => new Float64Array(width + 1));
  const row = new Float64Array(width + 1);
  let residual = 0;
  // Givens rotations update the QR factor without storing the lagged design matrix.
  for (let t = lag; t < difference.length; t += 1) {
    row[0] = 1;
    row[1] = level[t];
    for (let j = 2; j < width; j += 1) row[j] = difference[t - j + 1];
    row[width] = difference[t];
    for (let j = 0; j < width; j += 1) {
      if (row[j] === 0) continue;
      const factor = upper[j];
      const diagonal = Math.hypot(factor[j], row[j]);
      const cosine = factor[j] / diagonal;
      const sine = row[j] / diagonal;
      factor[j] = diagonal;
      for (let k = j + 1; k <= width; k += 1) {
        const previous = factor[k];
        factor[k] = cosine * previous + sine * row[k];
        row[k] = cosine * row[k] - sine * previous;
      }
    }
    residual += row[width] ** 2;
  }
  return { upper, residual, observations: difference.length - lag };
}

function chooseLag(fit: ReturnType<typeof regression>, method: Exclude<LagSelection, null>): number {
  const { upper, observations } = fit;
  const width = upper.length;
  const rss = new Float64Array(width + 1);
  rss[width] = fit.residual;
  for (let size = width - 1; size >= 2; size -= 1) rss[size] = rss[size + 1] + upper[size][width] ** 2;
  if (method === 't-stat') {
    for (let size = width; size > 2; size -= 1) {
      const t = Math.abs(upper[size - 1][width]) / Math.sqrt(rss[size] / (observations - size));
      if (t >= 1.6448536269514722) return size - 2;
    }
    return 0;
  }
  const penalty = method === 'AIC' ? 2 : Math.log(observations);
  let best = Infinity;
  let lag = 0;
  for (let size = 2; size <= width; size += 1) {
    const score = observations * Math.log(rss[size] / observations) + penalty * size;
    if (score < best) {
      best = score;
      lag = size - 2;
    }
  }
  return lag;
}

function adfStatistic({ upper, observations, residual }: ReturnType<typeof regression>): number | null {
  const width = upper.length;
  const tolerance = Number.EPSILON * upper[0][0] * width;
  if (observations <= width || upper.some((row, i) => row[i] <= tolerance)) return null;
  const coefficients = new Float64Array(width);
  const inverseColumn = new Float64Array(width);
  for (let i = width - 1; i >= 1; i -= 1) {
    let value = upper[i][width];
    for (let j = i + 1; j < width; j += 1) value -= upper[i][j] * coefficients[j];
    coefficients[i] = value / upper[i][i];
  }
  for (let i = 1; i < width; i += 1) {
    let value = i === 1 ? 1 : 0;
    for (let j = 1; j < i; j += 1) value -= upper[j][i] * inverseColumn[j];
    inverseColumn[i] = value / upper[i][i];
  }
  const variance = (inverseColumn.reduce((sum, value) => sum + value ** 2, 0) * residual) / (observations - width);
  const statistic = coefficients[1] / Math.sqrt(variance);
  return Number.isFinite(statistic) ? statistic : null;
}

function mackinnonPvalue(statistic: number): number {
  if (statistic > 2.74) return 1;
  if (statistic < -18.83) return 0;
  // MacKinnon's response surfaces for the ADF regression with a constant and one series.
  const z =
    statistic <= -1.61
      ? 2.1659 + statistic * (1.4412 + statistic * 0.038269)
      : 1.7339 + statistic * (0.93202 + statistic * (-0.12745 - 0.010368 * statistic));
  const tail = gammaSurvival(0.5, (z * z) / 2, Math.log(Math.sqrt(Math.PI))) / 2;
  return z < 0 ? tail : 1 - tail;
}

export function augmentedDickeyFuller(
  values: number[],
  maxLag: number | undefined,
  method: LagSelection,
  significance: number
) {
  if (values.length < 4) return null;
  const limit = Math.floor(values.length / 2) - 2;
  if (maxLag !== undefined && maxLag > limit)
    throw new Error(`ADF maxLag must be at most ${limit} for ${values.length} observations`);
  const maximum = maxLag ?? Math.min(limit, Math.ceil(12 * (values.length / 100) ** 0.25));
  const level = values.map((value) => value - values[0]);
  const scale = level.reduce((maximum, value) => Math.max(maximum, Math.abs(value)), 0);
  if (!scale) return null;
  if (Number.isFinite(scale)) {
    for (let i = 0; i < level.length; i += 1) level[i] /= scale;
  } else {
    const largest = values.reduce((maximum, value) => Math.max(maximum, Math.abs(value)), 0);
    for (let i = 0; i < level.length; i += 1) level[i] = values[i] / largest - values[0] / largest;
  }
  const difference = level.slice(1).map((value, i) => value - level[i]);
  const initial = regression(level, difference, maximum);
  const usedLag = method === null ? maximum : chooseLag(initial, method);
  const fit = usedLag === maximum ? initial : regression(level, difference, usedLag);
  const statistic = adfStatistic(fit);
  if (statistic === null) return null;
  const pvalue = mackinnonPvalue(statistic);
  return { statistic, pvalue, used_lag: usedLag, observations: fit.observations, stationary: pvalue < significance };
}
