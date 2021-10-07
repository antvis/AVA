import MersenneTwister from 'mersenne-twister';
import RandExp from 'randexp';
import { assert, range } from '../utils';
import { initOptions, MAX_INT, MIN_INT } from './utils';

/** @public */
export type RandomFunc = () => number;

function isFunction(target: any): target is RandomFunc {
  return typeof target === 'function';
}

/**
 * Basic(bool int float regexp) Generater
 * basic generator for bool int float regexp
 * @public
 */
export class BasicRandom {
  /**
   * extends class's prototype
   * @param options - methods
   *
   * @example
   * ```javascript
   * BasiceRandom.mixin({
   *  percent() {
   *    return `${this.float({ min: 0, max: 100, fixed: 2 })}%`;
   *  },
   * });
   *
   * const R = new Random();
   * R.percent(); // '10.12%'
   * R.n(R.percent, 2) // ['12.10%', '25.22%']
   * ```
   */
  static mixin(options: MixinOptions): void {
    for (let i = 0; i < Object.keys(options || {}).length; i += 1) {
      const key = Object.keys(options)[i];
      const value = options[key];
      this.prototype[key] = value;
    }
  }

  /**
   * generate 0 to 1, similar to Math.random
   */
  random: RandomFunc;

  /**
   * MersenneTwister's seed
   */
  private readonly seed?: number;

  /**
   * MersenneTwister
   */
  private mt?: MersenneTwister;

  constructor(seed?: number);

  constructor(seed?: RandomFunc);

  constructor(seed?: any) {
    // if user has provided a function, use that as the generator
    if (isFunction(seed)) {
      this.random = seed;
    } else {
      // If no generator function was provided, use our MT
      this.seed = seed;
      this.mt = new MersenneTwister(this.seed);
      this.random = this.mt.random.bind(this.mt);
    }
  }

  /**
   * Return a random boolean value (true or false).
   * @param options - options
   */
  boolean(options?: BooleanOptions): boolean {
    const { likelihood } = initOptions({ likelihood: 50 }, options);

    assert(likelihood >= 0 && likelihood <= 100, 'Likelihood accepts values from 0 to 100.');

    return this.random() > likelihood / 100;
  }

  /**
   * Reture a random integer
   * @param options - options
   */
  integer(options?: Interval): number {
    const { max, min } = initOptions({ min: MIN_INT, max: MAX_INT }, options);

    assert(min <= max, 'Min cannot be greater than Max.');

    return Math.floor(this.random() * (max - min + 1) + min);
  }

  /**
   * Genarate a float / double number
   *
   * @param options -
   */
  float(options: FloatOptions = {}): number {
    const opts = initOptions({ fixed: 4 }, options);
    const base = 10 ** opts.fixed;
    const max = MAX_INT / base;
    const min = -max;

    assert(
      !opts.min || !opts.fixed || opts.min >= min,
      `Min specified is out of range with fixed. Min should be, at least, ${min}`
    );
    assert(
      !opts.max || !opts.fixed || opts.max <= max,
      `Max specified is out of range with fixed. Max should be, at most, ${max}`
    );

    const optss = initOptions({ min, max }, opts);

    const num = this.integer({ min: optss.min * base, max: optss.max * base });
    const numFixed = (num / base).toFixed(opts.fixed);
    return Number.parseFloat(numFixed);
  }

  /**
   * generate an integer number
   * @param options -
   */
  natural(options: Interval = {}): number {
    const opts = initOptions({ min: 0, max: MAX_INT }, options);

    assert(opts.min >= 0, 'Min cannot be less than zero.');

    return this.integer(opts);
  }

  /**
   * Given an array, pick a random element and return it
   * @param array - The array to process
   *
   */
  pickone<T>(array: T[]): T {
    assert(array.length !== 0, 'Cannot pickone() from an empty array');

    return array[this.natural({ max: array.length - 1 })];
  }

  /**
   * Given an array, pick some random elements and return them in a new array
   * @param array - the array to process
   * @param count - the counts to pick
   */
  pickset<T>(array: T[], count = 1): T[] {
    if (count === 0) return [];

    assert(array.length !== 0, 'Cannot pickset() from an empty array');
    assert(count >= 0, 'Count must be a positive number');

    if (count === 1) {
      return [this.pickone(array)];
    }
    const arr = array.slice(0);
    let end = arr.length;
    return this.n(function (this: BasicRandom) {
      end -= 1;
      const index = this.natural({ max: end });
      const value = arr[index];
      arr[index] = arr[end];
      return value;
    }, Math.min(end, count));
  }

  /**
   * Given an array, scramble the order and return it.
   * @param array - the array to process
   * @public
   */
  shuffle<T>(array: T[]): T[] {
    const newArray: T[] = [];
    let j = 0;
    const { length } = array;
    const sourceIndexes = range(length);
    let lastSourceIndex = length - 1;
    let selectedSourceIndex;

    for (let i = 0; i < length; i += 1) {
      // Pick a random index from the array
      selectedSourceIndex = this.natural({ max: lastSourceIndex });
      j = sourceIndexes[selectedSourceIndex];

      // Add it to the new array
      newArray[i] = array[j];

      // Mark the source index as used
      sourceIndexes[selectedSourceIndex] = sourceIndexes[lastSourceIndex];
      lastSourceIndex -= 1;
    }

    return newArray;
  }

  /**
   * Provide any function that generates random stuff (usually another generate function)
   * and a number and n() will generate an array of items with a length matching the length you specified.
   * @param generator - the generator
   * @param length - the length
   * @param params - the generator's params
   *
   * @example
   * ```javascript
   *  const R = new Random();
   *  R.n(R.natural, 10, { min: 0, max: 100 }); // ten numbers which arn between  0 and 100
   * ```
   */
  n<T extends AnyFunc>(generator: T, length = 1, ...params: Parameters<T>): ReturnType<T>[] {
    assert(typeof generator === 'function', 'The first argument must be a function.');

    let i = length;
    const arr: ReturnType<T>[] = [];

    // Providing a negative count should result in a noop.
    i = Math.max(0, i);
    for (; i > 0; i -= 1) {
      arr.push(generator.apply(this, params));
    }

    return arr;
  }

  /**
   * Generate a string which match regexp
   *
   * @example
   * ```javascript
   *  new Random().randexp('\\d{4}-\\d{8}');
   * ```
   *
   * @param source - regexp or source of regexp
   * @param flag - flag(only support `i`)
   */
  randexp(source: string | RegExp, flag?: string): string {
    const rand = new RandExp(source, flag);
    return rand.gen();
  }
}

/**
 * @public
 */
export type AnyFunc = (...args: any[]) => any;
/**
 * the params to generate boolean
 * @public
 */
export interface BooleanOptions {
  /** likelihood 0-100 */
  likelihood?: number;
}

/**
 * @public
 */
export interface MixinOptions {
  [name: string]: AnyFunc;
}
/**
 * @public
 */
export interface Interval {
  /**
   * min
   */
  min?: number;
  /**
   * max
   */
  max?: number;
}
/**
 * The params to generate a float
 * @public
 */
export interface FloatOptions extends Interval {
  /**
   * precision
   */
  fixed?: number;
}
