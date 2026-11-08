/**
 * Statistical helper functions exposed to LLM-generated analysis code.
 */

export const STAT_SOURCE = `
const toNumbers = (arr, key) => arr.map((item) => Number(item?.[key]) || 0);

const calculateVariance = (arr, key) => {
  if (arr.length === 0) return 0;
  const values = toNumbers(arr, key);
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  return values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / values.length;
};

const stat = {
  groupBy: (arr, key) =>
    arr.reduce((acc, item) => {
      const group = String(item?.[key]);
      (acc[group] ??= []).push(item);
      return acc;
    }, {}),

  sum: (arr, key) => arr.reduce((sum, item) => sum + (Number(item?.[key]) || 0), 0),

  avg: (arr, key) => (arr.length > 0 ? stat.sum(arr, key) / arr.length : 0),

  max: (arr, key) => (arr.length > 0 ? Math.max(...toNumbers(arr, key)) : 0),

  min: (arr, key) => (arr.length > 0 ? Math.min(...toNumbers(arr, key)) : 0),

  count: (arr) => arr.length,

  sortBy: (arr, key, order = 'asc') =>
    [...arr].sort((a, b) => {
      const compare = a?.[key] > b?.[key] ? 1 : a?.[key] < b?.[key] ? -1 : 0;
      return order === 'asc' ? compare : -compare;
    }),

  median: (arr, key) => {
    if (arr.length === 0) return 0;
    const sorted = toNumbers(arr, key).sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  },

  variance: (arr, key) => calculateVariance(arr, key),

  stdDev: (arr, key) => Math.sqrt(calculateVariance(arr, key)),

  distinct: (arr, key) => [...new Set(arr.map((item) => item?.[key]))],

  filter: (arr, predicate) => arr.filter(predicate),

  first: (arr) => (arr.length > 0 ? arr[0] : undefined),

  last: (arr) => (arr.length > 0 ? arr[arr.length - 1] : undefined),
};
`;

export const stat = new Function(`${STAT_SOURCE}\nreturn stat;`)() as Record<string, any>;
