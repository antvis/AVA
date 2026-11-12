import { gammaSurvival } from './profile-chi-square';

type Contingency = { n: number; rows: number; columns: number; chi_squared: number };
const logGammaHalf = Math.log(Math.sqrt(Math.PI));

function normalCdf(x: number): number {
  const tail = gammaSurvival(0.5, (x * x) / 2, logGammaHalf) / 2;
  return x < 0 ? tail : 1 - tail;
}

function integral(f: (x: number) => number, high: number): number {
  const refine = (
    lo: number,
    hi: number,
    a: number,
    b: number,
    c: number,
    whole: number,
    tolerance: number,
    depth: number
  ): number => {
    const mid = (lo + hi) / 2;
    const left = f((lo + mid) / 2);
    const right = f((mid + hi) / 2);
    const l = ((mid - lo) * (a + 4 * left + b)) / 6;
    const r = ((hi - mid) * (b + 4 * right + c)) / 6;
    const error = l + r - whole;
    if (!depth || Math.abs(error) <= 15 * tolerance) return l + r + error / 15;
    return (
      refine(lo, mid, a, left, b, l, tolerance / 2, depth - 1) +
      refine(mid, hi, b, right, c, r, tolerance / 2, depth - 1)
    );
  };
  const a = f(0);
  const b = f(high / 2);
  const c = f(high);
  return refine(0, high, a, b, c, (high * (a + 4 * b + c)) / 6, 2e-13, 18);
}

function calibration(rows: number, columns: number) {
  const edges = (bins: number) => Array.from({ length: bins + 1 }, (_, i) => -5 + (10 * i) / bins);
  const x = edges(rows);
  const y = edges(columns);
  const xCdf = x.map(normalCdf);
  const yCdf = y.map(normalCdf);
  const expected = x
    .slice(1)
    .map((_, i) => y.slice(1).map((_, j) => (xCdf[i + 1] - xCdf[i]) * (yCdf[j + 1] - yCdf[j])));
  let maximum = 0;
  for (let i = 0; i < rows; i += 1) {
    for (let j = 0; j < columns; j += 1) {
      const lower = Math.max(x[i], y[j]);
      const upper = Math.min(x[i + 1], y[j + 1]);
      const overlap = upper > lower ? normalCdf(upper) - normalCdf(lower) : 0;
      maximum += (overlap - expected[i][j]) ** 2 / expected[i][j];
    }
  }
  return { x, y, expected, maximum };
}

function theoreticalChiSquare(rho: number, { x, y, expected }: ReturnType<typeof calibration>): number {
  // Plackett's identity integrates the bivariate normal density over the correlation parameter.
  const angle = Math.asin(rho);
  const corners = x.map((a) =>
    y.map((b) => {
      const squared = (a - b) ** 2 / 2;
      const product = a * b;
      return (
        integral((theta) => Math.exp(-squared / Math.cos(theta) ** 2 - product / (1 + Math.sin(theta))), angle) /
        (2 * Math.PI)
      );
    })
  );
  let sum = 0;
  for (let i = 0; i < x.length - 1; i += 1) {
    for (let j = 0; j < y.length - 1; j += 1) {
      const delta = corners[i + 1][j + 1] - corners[i + 1][j] - corners[i][j + 1] + corners[i][j];
      sum += delta ** 2 / expected[i][j];
    }
  }
  return sum;
}

export function phiKMatrix(
  raw: { columns: string[]; matrix: (Contingency | null)[][] } | null,
  noiseCorrection: boolean
) {
  if (!raw) return null;
  const calibrations = new Map<string, ReturnType<typeof calibration>>();
  const coefficient = (cell: Contingency | null) => {
    if (!cell) return null;
    const { n, rows, columns, chi_squared: observed } = cell;
    const noise = noiseCorrection ? (rows - 1) * (columns - 1) : 0;
    if (observed <= noise) return 0;
    const maximum = n * Math.min(rows - 1, columns - 1);
    if (observed >= maximum) return 1;
    const key = `${rows}:${columns}`;
    const reference = calibrations.get(key) ?? calibration(rows, columns);
    calibrations.set(key, reference);
    const target = ((observed - noise) * reference.maximum) / (maximum - noise);
    let lo = 0;
    let hi = 1;
    while (hi - lo > 1e-7) {
      const middle = (lo + hi) / 2;
      if (theoreticalChiSquare(middle, reference) < target) lo = middle;
      else hi = middle;
    }
    return (lo + hi) / 2;
  };
  const matrix: (number | null)[][] = raw.columns.map(() => Array(raw.columns.length).fill(null));
  for (let i = 0; i < matrix.length; i += 1) {
    matrix[i][i] = 1;
    for (let j = i + 1; j < matrix.length; j += 1) matrix[i][j] = matrix[j][i] = coefficient(raw.matrix[i][j]);
  }
  return { columns: raw.columns, matrix };
}
