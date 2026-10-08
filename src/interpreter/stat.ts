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

export const STAT_OPS_PROMPT = `You have access to a "data" array and a "stat" object with helper functions:
- stat.groupBy(arr, key) - Group array by key
- stat.sum(arr, key) - Sum values by key
- stat.avg(arr, key) - Average values by key
- stat.max(arr, key) - Max value by key
- stat.min(arr, key) - Min value by key
- stat.median(arr, key) - Median value by key
- stat.variance(arr, key) - Variance by key
- stat.stdDev(arr, key) - Standard deviation by key
- stat.distinct(arr, key) - Unique values by key
- stat.count(arr) - Count items
- stat.sortBy(arr, key, order) - Sort array ('asc' or 'desc')
- stat.filter(arr, predicate) - Filter array by condition
- stat.first(arr) - Get first element
- stat.last(arr) - Get last element`;

export const STAT_OPS_EXAMPLE = `Examples:

1. Grouping and aggregation:
const grouped = stat.groupBy(data, 'region');
const result = Object.keys(grouped).map(region => ({
  region,
  avgRevenue: stat.avg(grouped[region], 'revenue'),
  totalSales: stat.sum(grouped[region], 'sales')
}));

2. Statistical analysis:
const result = {
  mean: stat.avg(data, 'value'),
  median: stat.median(data, 'value'),
  stdDev: stat.stdDev(data, 'value')
};

3. Filtering and sorting:
const filtered = stat.filter(data, item => item.score > 80);
const result = stat.sortBy(filtered, 'score', 'desc');

4. Finding unique values and counts:
const categories = stat.distinct(data, 'category');
const result = categories.map(cat => ({
  category: cat,
  count: stat.count(stat.filter(data, item => item.category === cat))
}));

5. Getting boundary elements:
const result = {
  firstEntry: stat.first(data),
  lastEntry: stat.last(data),
  topScorer: stat.first(stat.sortBy(data, 'score', 'desc'))
};`;
