/**
 * Random generate value
 *
 * @example
 * ```javascript
 * import { random } from '@antv/data-wizard';
 *
 * const name = random.name();
 * ```
 *
 * with your own seed
 * ```javascript
 * import { random } from '@antv/data-wizard';
 * const random = new random.Random(200);
 * console.log(random.phone());
 * ```
 * extend
 * ```javascript
 * import { random } from '@antv/data-wizard';
 * random.Random.mixin({
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

import { Random } from './random';

export * from './basic-random';
export * from './text-random';
export * from './web-random';
export * from './color-random';
export * from './location-random';
export * from './datetime-random';
export * from './cn-address-random';
export * from './random';

export { WebDB, ColorDB, TextDB, DateTimeDB, Database } from './database';

/**
 * eport all random method as default
 * @public
 */
export default new Random();
