import { lastIndexOf } from 'lodash';

import { Meta } from '../types';

import { isArray } from './isType';

// sign
export function sign(value: number) {
  if (value > 0) return 1;
  return value < 0 ? -1 : 0;
}

// unique
export function unique(arr: string[] | number[]): [(string | number)[], number[]] {
  const sorted = arr.slice().sort();

  const uniqArr = [sorted[0]];
  const countArr = [1];
  for (let i = 1; i < sorted.length; i += 1) {
    if (sorted[i] !== uniqArr[uniqArr.length - 1]) {
      uniqArr.push(sorted[i]);
      countArr.push(1);
    } else {
      countArr[countArr.length - 1] += 1;
    }
  }

  return [uniqArr, countArr];
}

// rank
export function rank(arr: (string | number)[]): number[] {
  const sorted = arr.slice().sort();
  const rank: number[] = [];
  for (let i = 0; i < arr.length; i += 1) {
    const value = arr[i];
    const firstRank = sorted.indexOf(value) + 1;
    const lastRank = lastIndexOf(sorted, value) + 1;
    rank.push(firstRank === lastRank ? firstRank : (firstRank + lastRank) / 2);
  }
  return rank;
}

/**
 * assert
 * @param condition
 * @param errorMessage
 */
export function assert(condition: unknown, errorMessage?: string): asserts condition {
  if (!condition) throw new Error(errorMessage);
}

/**
 * Generate an array from 0 to number.
 * @param number
 */
export function range(number: Number) {
  return [...Array(number).keys()];
}

/** Generate an array with all 1 elements */
export function nOnes(n: number) {
  return Array(n).fill(1);
}

/** Generate an array with all 0 elements */
export function nZeros(n: number) {
  return Array(n).fill(0);
}

/**
 * Check parent-child relationship. A child has only one parent, but a parent can have more children.
 * @param parent
 * @param child
 */
export function isParentChild(parent: (string | number)[], child: (string | number)[]): boolean {
  if (
    !isArray(parent) ||
    parent.length === 0 ||
    !isArray(child) ||
    child.length === 0 ||
    parent.length !== child.length
  )
    return false;

  const record: Record<string | number, any> = {};
  for (let i = 0; i < child.length; i += 1) {
    const c = child[i];
    const p = parent[i];
    if (!record[c]) {
      record[c] = p;
    } else if (record[c] !== p) {
      return false;
    }
  }

  return true;
}

/**
 * lodash sortby asc function
 * @param left unknown
 * @param right unknown
 * @returns number
 */
export function ascending(left: unknown, right: unknown) {
  const leftIsNull = left === null || left === undefined;
  const rightIsNull = right === null || right === undefined;
  if (leftIsNull && rightIsNull) {
    return 0;
  }
  if (leftIsNull) {
    return 1;
  }
  if (rightIsNull) {
    return -1;
  }
  return (left as number) - (right as number);
}

/**
 * lodash sortby desc function
 * @param left any
 * @param right any
 * @returns number
 */
export function descending(left: unknown, right: unknown) {
  const leftIsNull = left === null || left === undefined;
  const rightIsNull = right === null || right === undefined;
  if (leftIsNull && rightIsNull) {
    return 0;
  }
  if (leftIsNull) {
    return 1;
  }
  if (rightIsNull) {
    return -1;
  }
  return (right as number) - (left as number);
}

export const logInDev = {
  log(...args) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log(...args);
    }
  },
  warn(...args) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.warn(...args);
    }
  },
  debug(...args) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.debug(...args);
    }
  },
};

export const logError = (...args) => {
  // eslint-disable-next-line no-console
  console.error(...args);
};

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const safeJsonParse = (str: string, defaultVal = {}) => {
  try {
    return JSON.parse(str);
  } catch (e) {
    return defaultVal;
  }
};

export const metasToMap = (metas: Meta[]): Record<string, Meta> => {
  return metas.reduce((acc, cur) => {
    acc[cur.id] = cur;
    return acc;
  }, {});
};
