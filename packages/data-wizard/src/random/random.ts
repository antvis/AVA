import { BasicRandom } from './basic-random';
import { TextRandom } from './text-random';
import { WebRandom } from './web-random';
import { LocationRandom } from './location-random';
import { DateTimeRandom } from './datetime-random';
import { AddressRandom } from './address-random';
import { getAllDB, Database } from './database';
import { ColorRandom } from './color-random';

/**
 * Random constructor
 * @public
 */
export class Random extends BasicRandom {
  database: Database = getAllDB();
}

/**
 * Random Interface
 * @public
 * @remarks {@link BasicRandom} {@link TextRandom} {@link WebRandom} {@link ColorRandom} {@link AddressRandom}
 */
// eslint-disable-next-line no-redeclare
export interface Random extends TextRandom, WebRandom, ColorRandom, LocationRandom, DateTimeRandom, AddressRandom {
  /**
   * merge all database
   */
  database: Database;
}

type Constructor<T = {}> = new (...args: any[]) => T;

(function applyMixins<T extends Constructor<BasicRandom>>(derivedCtor: T, baseCtors: T[]): void {
  baseCtors.forEach((baseCtor) => {
    Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
      Object.defineProperty(derivedCtor.prototype, name, Object.getOwnPropertyDescriptor(baseCtor.prototype, name)!);
    });
  });
})(Random, [TextRandom, WebRandom, ColorRandom, LocationRandom, DateTimeRandom, AddressRandom]);
