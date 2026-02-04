/**
 * Statistical operations for data analysis
 * This module provides common data operations used in analysis
 */

/**
 * Helper function to calculate variance
 */
const calculateVariance = (arr: any[], key: string): number => {
  if (arr.length === 0) return 0;
  const values = arr.map(item => Number(item[key]) || 0);
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
};

/**
 * Statistical operations object with data manipulation functions
 */
export const stat = {
  /**
   * Group array by a specific key
   * @param arr - Array to group
   * @param key - Key to group by
   * @returns Object with grouped items
   */
  groupBy: (arr: any[], key: string) => {
    return arr.reduce((acc, item) => {
      const group = item[key];
      if (!acc[group]) acc[group] = [];
      acc[group].push(item);
      return acc;
    }, {});
  },

  /**
   * Calculate sum of values for a specific key
   * @param arr - Array to sum
   * @param key - Key to sum by
   * @returns Sum of values
   */
  sum: (arr: any[], key: string) => {
    return arr.reduce((sum, item) => sum + (Number(item[key]) || 0), 0);
  },

  /**
   * Calculate average of values for a specific key
   * @param arr - Array to average
   * @param key - Key to average by
   * @returns Average value
   */
  avg: (arr: any[], key: string) => {
    const total = arr.reduce((sum, item) => sum + (Number(item[key]) || 0), 0);
    return arr.length > 0 ? total / arr.length : 0;
  },

  /**
   * Find maximum value for a specific key
   * @param arr - Array to search
   * @param key - Key to find max by
   * @returns Maximum value
   */
  max: (arr: any[], key: string) => {
    return Math.max(...arr.map(item => Number(item[key]) || 0));
  },

  /**
   * Find minimum value for a specific key
   * @param arr - Array to search
   * @param key - Key to find min by
   * @returns Minimum value
   */
  min: (arr: any[], key: string) => {
    return Math.min(...arr.map(item => Number(item[key]) || 0));
  },

  /**
   * Count number of items in array
   * @param arr - Array to count
   * @returns Count of items
   */
  count: (arr: any[]) => arr.length,

  /**
   * Sort array by a specific key
   * @param arr - Array to sort
   * @param key - Key to sort by
   * @param order - Sort order ('asc' or 'desc')
   * @returns Sorted array
   */
  sortBy: (arr: any[], key: string, order: 'asc' | 'desc' = 'asc') => {
    return [...arr].sort((a, b) => {
      const valA = a[key];
      const valB = b[key];
      const compare = valA > valB ? 1 : valA < valB ? -1 : 0;
      return order === 'asc' ? compare : -compare;
    });
  },

  /**
   * Calculate median value for a specific key
   * @param arr - Array to calculate median from
   * @param key - Key to get median by
   * @returns Median value
   */
  median: (arr: any[], key: string) => {
    if (arr.length === 0) return 0;
    const sorted = [...arr].map(item => Number(item[key]) || 0).sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  },

  /**
   * Calculate variance for a specific key
   * @param arr - Array to calculate variance from
   * @param key - Key to get variance by
   * @returns Variance value
   */
  variance: (arr: any[], key: string) => {
    return calculateVariance(arr, key);
  },

  /**
   * Calculate standard deviation for a specific key
   * @param arr - Array to calculate standard deviation from
   * @param key - Key to get standard deviation by
   * @returns Standard deviation value
   */
  stdDev: (arr: any[], key: string) => {
    return Math.sqrt(calculateVariance(arr, key));
  },

  /**
   * Get distinct/unique values for a specific key
   * @param arr - Array to get unique values from
   * @param key - Key to get unique values by
   * @returns Array of unique values
   */
  distinct: (arr: any[], key: string) => {
    return [...new Set(arr.map(item => item[key]))];
  },

  /**
   * Filter array by a predicate function
   * Provides a consistent API for filtering within generated code
   * @param arr - Array to filter
   * @param predicate - Function that returns true for items to keep
   * @returns Filtered array
   */
  filter: (arr: any[], predicate: (item: any) => boolean) => {
    return arr.filter(predicate);
  },

  /**
   * Get first element of array
   * @param arr - Array to get first element from
   * @returns First element or undefined
   */
  first: (arr: any[]) => {
    return arr.length > 0 ? arr[0] : undefined;
  },

  /**
   * Get last element of array
   * @param arr - Array to get last element from
   * @returns Last element or undefined
   */
  last: (arr: any[]) => {
    return arr.length > 0 ? arr[arr.length - 1] : undefined;
  },
};

/**
 * Stat operations prompt for LLM
 * This describes the available statistical operations that can be used in generated code
 */
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
- stat.sortBy(arr, key, order) - Sort array
- stat.filter(arr, predicate) - Filter array by condition
- stat.first(arr) - Get first element
- stat.last(arr) - Get last element`;

/**
 * Example usage of stat operations for LLM prompt
 */
export const STAT_OPS_EXAMPLE = `Examples:

1. Grouping and aggregation:
const grouped = stat.groupBy(data, 'region');
const result = Object.keys(grouped).map(region => ({
  region,
  avgRevenue: stat.avg(grouped[region], 'revenue'),
  totalSales: stat.sum(grouped[region], 'sales')
}));

2. Statistical analysis:
const scores = data;
const result = {
  mean: stat.avg(scores, 'value'),
  median: stat.median(scores, 'value'),
  stdDev: stat.stdDev(scores, 'value'),
  min: stat.min(scores, 'value'),
  max: stat.max(scores, 'value')
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
