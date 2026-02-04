/**
 * Statistical operations for data analysis
 * This module provides common data operations used in analysis
 */

/**
 * Data operations object with statistical and data manipulation functions
 */
export const dataOps = {
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
   * @returns Maximum value, or 0 if array is empty
   */
  max: (arr: any[], key: string) => {
    if (arr.length === 0) return 0;
    return Math.max(...arr.map(item => Number(item[key]) || 0));
  },

  /**
   * Find minimum value for a specific key
   * @param arr - Array to search
   * @param key - Key to find min by
   * @returns Minimum value, or 0 if array is empty
   */
  min: (arr: any[], key: string) => {
    if (arr.length === 0) return 0;
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
};

/**
 * Stat operations prompt for LLM
 * This describes the available statistical operations that can be used in generated code
 */
export const STAT_OPS_PROMPT = `You have access to a "data" array and an "ops" object with helper functions:
- ops.groupBy(arr, key) - Group array by key
- ops.sum(arr, key) - Sum values by key
- ops.avg(arr, key) - Average values by key
- ops.max(arr, key) - Max value by key
- ops.min(arr, key) - Min value by key
- ops.count(arr) - Count items
- ops.sortBy(arr, key, order) - Sort array`;

/**
 * Example usage of stat operations for LLM prompt
 */
export const STAT_OPS_EXAMPLE = `Example:
const grouped = ops.groupBy(data, 'region');
const result = Object.keys(grouped).map(region => ({
  region,
  avgRevenue: ops.avg(grouped[region], 'revenue')
}));`;
