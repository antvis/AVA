import { BasicRandom } from './basic-random';
import { ColorDB, getColorDB } from './database';
import { initOptions } from './utils';
import { rgb, hsl, RGBBaseOptions, HSLBaseOPtions } from './color-utils';

export { RGBBaseOptions, HSLBaseOPtions };

/**
 * Generator for color
 * @public
 */
export class ColorRandom extends BasicRandom {
  database: ColorDB = getColorDB();

  /**
   * return a rag color
   */
  rgb(options?: RGBOptions): string {
    const { casing } = initOptions({ casing: 'lower' }, options);
    const rgbNums = rgb.call(this, options);
    const value = `rgb(${rgbNums.join(',')})`;
    return casing === 'lower' ? value : value.toUpperCase();
  }

  /**
   * return a rag color with alpha
   */
  rgba(optios?: RGBAOptions): string {
    const { casing, maxA, minA } = initOptions({ casing: 'lower', minA: 0, maxA: 1 }, optios);
    const alpah = this.float({ min: minA, max: maxA });
    const rgbNums = rgb.call(this, optios);
    const value = `rgba(${rgbNums.concat(alpah).join(',')})`;
    return casing === 'lower' ? value : value.toUpperCase();
  }

  /**
   *  return a hsl color
   */
  hsl(options?: HSLOptions): string {
    const { casing } = initOptions({ casing: 'lower' }, options);
    const value = `hsl(${hsl.call(this, options).join(',')})`;
    return casing === 'lower' ? value : value.toUpperCase();
  }

  /**
   * return a hsl color with alpha
   */
  hsla(options?: HSLAOptions): string {
    const { casing, maxA, minA } = initOptions({ casing: 'lower', minA: 0, maxA: 1 }, options);
    const alpah = this.float({ min: minA, max: maxA });
    const value = `hsla(${hsl.call(this, options).concat(alpah).join(',')})`;
    return casing === 'lower' ? value : value.toUpperCase();
  }

  /**
   * return a {@link https://developer.mozilla.org/en-US/docs/Web/CSS/color_value | Color Keyword}
   */
  colorName(): string {
    return this.pickone(this.database.colorKeywords);
  }

  /**
   * return a hex color
   * @param options - the parmas
   */
  hexColor(options?: HexColorOptions): string {
    const { prefix, casing } = initOptions({ prefix: true, casing: 'lower' }, options);
    const rgbNums = rgb.call(this, options);
    const v = rgbNums.map((item) => item.toString(16).padStart(2, '0')).join('');
    const value = casing === 'lower' ? v : v.toUpperCase();
    return prefix ? `#${value}` : value;
  }

  /**
   * return a	decimal color
   * @param options - the parmas
   */
  decimalColor(options?: RGBBaseOptions): number {
    const v = this.hexColor({ ...options, prefix: false });
    return parseInt(v, 16);
  }
}

type Casing = 'lower' | 'upper';

/**
 * @public
 */
export interface RGBOptions extends RGBBaseOptions {
  /** the case */
  casing?: Casing;
}

/**
 * @public
 */
export interface RGBAOptions extends RGBBaseOptions {
  casing?: Casing;
  minA: number;
  maxA: number;
}

/**
 * @public
 */
export interface HSLOptions extends HSLBaseOPtions {
  casing?: Casing;
}
/**
 * @public
 */
export interface HSLAOptions extends HSLBaseOPtions {
  casing?: Casing;
  minA: number;
  maxA: number;
}
/**
 * @public
 */
export interface HexColorOptions extends RGBOptions {
  /** has prefix or not `#` */
  prefix?: boolean;
}
