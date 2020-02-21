/**
 * Random generate value
 *
 * @example
 * ```javascript
 * import random from '@antv/dw-random';
 *
 * const name = random.name();
 * ```
 *
 * with your own seed
 * ```javascript
 * import { Random } from '@antv/dw-random';
 * const random = new Random(200);
 * console.log(random.phone());
 * ```
 * extend
 * ```javascript
 * import { Random } from '@antv/dw-random';
 * Random.mixin({
 *  user() {
 *    return {
 *      name: this.cname(),
 *      aget: this.integer({ max: 50, min: 25 })
 *    }
 *  }
 * })
 * ```
 *
 * @packageDocumentation
 */

export * from './basic-random';
export * from './text-random';
export * from './web-random';
export * from './color-random';
export * from './location-random';
export * from './datetime-random';
export * from './ch-address-random';
export * from './random';

import { Random } from './random';

export { WebDB, ColorDB, TextDB, DateTimeDB, Database } from './database';

/**
 * eport all random method as default
 * @public
 */
export default new Random();
