import { assert } from '../utils';
import { BasicRandom } from './basic-random';
import { initOptions } from './utils';
/**
 *
 * @public
 */
export interface RGBBaseOptions {
  grayscale?: boolean;
  min?: number;
  max?: number;
  minR?: number;
  maxR?: number;
  minG?: number;
  maxG?: number;
  minB?: number;
  maxB?: number;
}

/**
 * Generate RGB color.
 * @param options - the params
 */
export function rgb(this: BasicRandom, options: RGBBaseOptions = {}): [number, number, number] {
  const { grayscale, max, min } = initOptions(
    {
      grayscale: false,
      min: 0,
      max: 255,
    },
    options
  );

  assert(min >= 0 && max <= 255, 'min and max must between in [0, 255]');

  let minRgb = min;
  let maxRgb = max;
  const minR = options.minR === undefined ? min : options.minR;
  const maxR = options.maxR === undefined ? max : options.maxR;
  const minG = options.minG === undefined ? min : options.minG;
  const maxG = options.maxG === undefined ? max : options.maxG;
  const minB = options.minB === undefined ? min : options.minB;
  const maxB = options.maxB === undefined ? max : options.maxB;
  if (
    grayscale &&
    min === 0 &&
    max === 255 &&
    minR !== undefined &&
    minR !== undefined &&
    minG !== undefined &&
    maxG !== undefined &&
    minB !== undefined &&
    maxB !== undefined
  ) {
    minRgb = (minR + minG + minG) / 3;
    maxRgb = (maxR + maxG + maxB) / 3;
  }
  if (grayscale) {
    return new Array(3).fill(this.natural({ min: minRgb, max: maxRgb })) as [number, number, number];
  }
  return [
    this.natural({ min: minR, max: maxR }),
    this.natural({ min: minG, max: maxG }),
    this.natural({ min: minB, max: maxB }),
  ];
}

/**
 * the params for hls color
 * @public
 */
export interface HSLBaseOPtions {
  minH?: number;
  maxH?: number;
  minS?: number;
  maxS?: number;
  minL?: number;
  maxL?: number;
}
/**
 * generate HSL color
 * @param options
 */
export function hsl(this: BasicRandom, options?: HSLBaseOPtions): [number, string, string] {
  const opts = initOptions(
    {
      minH: 0,
      maxH: 360,
      minS: 0,
      maxS: 100,
      minL: 0,
      maxL: 100,
    },
    options
  );
  return [
    this.natural({ min: opts.minH, max: opts.maxH }),
    `${this.float({ min: opts.minS, max: opts.maxS })}%`,
    `${this.float({ min: opts.minS, max: opts.maxS })}%`,
  ];
}
