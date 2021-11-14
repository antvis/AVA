import { TextRandom } from './text-random';
import { getWebDB, WebDB, TextDB, getTextDB } from './database';
import { initOptions } from './utils';

/**
 * Generator for web
 * @public
 */
export class WebRandom extends TextRandom {
  database: WebDB & TextDB = { ...getTextDB(), ...getWebDB() };

  /**
   * Return a random top-level domain ({@link https://en.wikipedia.org/wiki/Top-level_domain | TLD})
   * @remarks return one of database.tlds
   */
  tld(): string {
    return this.pickone(this.database.tld);
  }

  /**
   * Return a random domain
   * @param options - the params
   */
  domain(options?: DomainOptions): string {
    return `${this.word()}.${(options && options.tld) || this.tld()}`;
  }

  /**
   * Return a random url
   * @param options - the params
   */
  url(options?: UrlOptions): string {
    const opts = initOptions(
      {
        protocol: 'http',
        domain: this.domain(options),
        domainPrefix: '',
        path: this.word(),
        extensions: [],
      },
      options
    );

    const { protocol, domainPrefix, path } = opts;

    const extension = opts.extensions.length > 0 ? `.${this.pickone(opts.extensions)}` : '';
    const domain = domainPrefix ? `${domainPrefix}.opts.domain` : opts.domain;

    return `${protocol}://${domain}/${path}${extension}`;
  }

  /**
   * Return a random ip v4
   */
  ipv4(): string {
    return `${this.natural({ min: 1, max: 254 })}.${this.natural({ max: 255 })}.${this.natural({
      max: 255,
    })}.${this.natural({ min: 1, max: 254 })}`;
  }

  /**
   * Return a random ip v6
   */
  ipv6(): string {
    const hash = (): string => this.n(() => this.natural({ min: 0, max: 15 }).toString(16), 4).join('');
    const ipAddr = this.n(hash, 8);
    return ipAddr.join(':');
  }

  /**
   * Return a random email
   * @param options - the params
   */
  email(options: EmailOptions = {}): string {
    return `${this.word({ length: options.length })}@${options.domain || this.domain()}`;
  }
}

/** @public */
export interface DomainOptions {
  tld?: string;
}

/** @public */
export interface UrlOptions extends DomainOptions {
  protocol?: string;
  domain?: string;
  domainPrefix?: string;
  path?: string;
  // extension file name
  extensions?: string[];
}

/** @public */
export interface EmailOptions {
  domain?: string;
  length?: number;
}
