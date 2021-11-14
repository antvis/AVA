import { assert } from '../utils';
import { BasicRandom, FloatOptions } from './basic-random';
import { initOptions } from './utils';

const MAX_LAT = 90;
const MIN_LAT = -90;
const MAX_LONG = 180;
const MIN_LONG = -180;

/**
 * The Generator for location
 * @public
 */
export class LocationRandom extends BasicRandom {
  /**
   * return a random longtitude
   * @param options - the params
   */
  longtitude(options?: FloatOptions): number {
    const opts = initOptions({ max: MAX_LONG, min: MIN_LONG, fixed: 7 }, options);

    assert(opts.min >= -180 && opts.max <= 180, 'longtitude must between  [-180, 180]');

    return this.float(opts);
  }

  /**
   * return a random latitude
   * @param options - the params
   */
  latitude(options?: FloatOptions): number {
    const opts = initOptions({ max: MAX_LAT, min: MIN_LAT, fixed: 7 }, options);
    assert(opts.min >= -90 && opts.max <= 90, 'latitude must between  [-90, 90]');
    return this.float(opts);
  }

  /**
   * return a random coordinates
   * @param options - the params
   */
  coordinates(options?: CoordinatesOptions): string {
    const { minLat, maxLat, minLong, maxLong, fixed } = initOptions({}, options);
    return [
      this.longtitude({ min: minLong, max: maxLong, fixed }),
      this.latitude({ min: minLat, max: maxLat, fixed }),
    ].join(', ');
  }
}

/**  @public */
export interface CoordinatesOptions {
  maxLat?: number;
  minLat?: number;
  maxLong?: number;
  minLong?: number;
  fixed?: number;
}
