import { format } from 'date-fns';
import { BasicRandom, Interval } from './basic-random';
import { initOptions } from './utils';
import { DateTimeDB, getDateTimeDB } from './database';

/**
 * Generator for date
 * @public
 */
export class DateTimeRandom extends BasicRandom {
  /**
   * return a random date which format is yyyy-MM-dd
   */
  database: DateTimeDB = getDateTimeDB();

  /**
   * return a random full date {@link https://tools.ietf.org/html/rfc3339#section-5.6 | full-date}
   * @param options - the params
   */
  date(options?: Interval): string {
    return this.datetime({ ...options, format: 'yyyy-MM-dd' });
  }

  /**
   * return a random full time {@link https://tools.ietf.org/html/rfc3339#section-5.6 | full-time}
   * @param options - the params
   */
  time(options?: TimeOptions): string {
    const opts = initOptions({ short: false }, options);
    return this.datetime({ ...options, format: opts.short ? 'HH:mm:ss' : 'HH:mm:ssXXX' });
  }

  /**
   * return a random date-time (full-data T fulltime) {@link https://tools.ietf.org/html/rfc3339#section-5.6 | date-time}
   *
   * @remarks
   * {@link https://date-fns.org/v2.0.1/docs/format | format}
   * @param options - the params
   */
  datetime(options?: DateTimeOptions): string {
    const opts = initOptions({ format: "yyyy-MM-dd'T'HH:mm:ssXXX" }, options);
    const timestamp = this.timestamp(opts);
    return format(timestamp, opts.format);
  }

  /**
   * return a random timestamp
   * @param options - the params
   */
  timestamp(options: Interval): number {
    const opts = initOptions({ min: 0, max: new Date().getTime() }, options);
    return this.natural(opts);
  }

  /**
   * return a random weekday
   *
   * @example
   * ```javascript
   * new DateTimeRandom().weekday({ locale: 'zh-CN' }) // 星期一
   * new DateTimeRandom().weekday({ abbr: true }) // Mon.
   * ```
   * @param options - the params
   * @public
   */
  weekday(options?: WeekDayOptions): string {
    const { locale, abbr } = initOptions({ abbr: false, locale: 'en-US' }, options);
    const list: any[][] = this.database.weekday[locale];
    const target = this.pickone(list);
    if (abbr) return target[1] || target[0];
    return target[0];
  }

  /**
   * return a random month
   *
   * @param options - the params
   * @public
   */
  month(options?: MonthOptions): string {
    const { locale, abbr } = initOptions({ abbr: false, locale: 'en-US' }, options);
    const list: any[][] = this.database.month[locale];
    const target = this.pickone(list);
    if (abbr) return target[1] || target[0];
    return target[0];
  }
}

/** @public */
export interface DateTimeOptions extends Interval {
  /** the format {@link https://date-fns.org/v2.0.1/docs/format | keyword} */
  format?: string;
}

/** @public */
export interface TimeOptions extends Interval {
  /** has the UTC time offset */
  short?: boolean;
}

type Locale = 'en-US' | 'zh-CN';

/** @public */
export interface WeekDayOptions {
  locale?: Locale;
  abbr?: boolean;
}

/** @public */
export interface MonthOptions {
  locale?: Locale;
  abbr?: boolean;
}
