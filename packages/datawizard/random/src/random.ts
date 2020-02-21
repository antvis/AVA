import { BasicRandom } from './basic-random';
import { TextRandom } from './text-random';
import { WebRandom } from './web-random';
import { LocationRandom } from './location-random';
import { DateTimeRandom } from './datetime-random';
import { ChAddressRandom } from './ch-address-random';
import { applyMixins } from './utils';
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
 * @remarks {@link BasicRandom} {@link TextRandom} {@link WebRandom} {@link ColorRandom} {@link ChAddressRandom}
 */
export interface Random extends TextRandom, WebRandom, ColorRandom, LocationRandom, DateTimeRandom, ChAddressRandom {
  /**
   * 所有database的合并
   */
  database: Database;
}

applyMixins(Random, [TextRandom, WebRandom, ColorRandom, LocationRandom, DateTimeRandom, ChAddressRandom]);
