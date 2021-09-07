import { assert } from '../utils';
import { TextDB, getTextDB } from './database';
import { initOptions, capitalize } from './utils';
import { BasicRandom, Interval } from './basic-random';

/**
 * Generator for string
 * @public
 */
export class TextRandom extends BasicRandom {
  database: TextDB = getTextDB();

  /**
   * Return a random char
   *
   * @param options -
   */
  character(options?: CharacterOptions): string {
    const opts = initOptions(options, { lower: true, upper: true, symbols: true, numeric: true });
    let pool = '';
    if (opts.pool) {
      pool = opts.pool;
    } else {
      if (opts.lower) {
        pool += this.database.character.lower;
      }
      if (opts.upper) {
        pool += this.database.character.upper;
      }
      if (opts.symbols) {
        pool += this.database.character.symbol;
      }
      if (opts.numeric) {
        pool += this.database.character.number;
      }
    }

    return pool.charAt(this.natural({ max: pool.length - 1 }));
  }

  /**
   * Return a random string
   *
   * @param options - the params
   *
   * @public
   */
  string(options?: StringOptions): string {
    const opts = initOptions(options, { length: this.natural({ min: 5, max: 20 }) });
    assert(opts.length < 0, 'Length cannot be less than zero.');
    const { length } = opts;
    const text = this.n(this.character, length, opts);

    return text.join('');
  }

  /**
   * Return a random syllable
   * @param options - the params
   * @internal
   */
  syllable(options?: SyllableOptions): string {
    const { length } = initOptions(options, { length: this.natural({ min: 2, max: 3 }) });
    const { consonants, vowels } = this.database.syllable; // consonants except hard to speak ones
    const all = consonants + vowels; // all
    let text = '';
    let chr = '';

    // I'm sure there's a more elegant way to do this, but this works
    // decently well.
    for (let i = 0; i < length; i += 1) {
      if (i === 0) {
        // First character can be anything
        chr = this.character({ pool: all });
      } else if (consonants.indexOf(chr) === -1) {
        // Last character was a vowel, now we want a consonant
        chr = this.character({ pool: consonants });
      } else {
        // Last character was a consonant, now we want a vowel
        chr = this.character({ pool: vowels });
      }

      text += chr;
    }

    if (options && options.capitalize) {
      text = capitalize(text);
    }

    return text;
  }

  /**
   * return a random world
   * @param options - the params
   */
  word(options: WordOptions = {}): string {
    assert(options.syllables && options.length, 'Cannot specify both syllables AND length.');

    const syllables = options.syllables || this.natural({ min: 1, max: 3 });
    let text = '';

    if (options.length) {
      // Either bound word by length
      do {
        text += this.syllable();
      } while (text.length < options.length);
      text = text.substring(0, options.length);
    } else {
      // Or by number of syllables
      for (let i = 0; i < syllables; i += 1) {
        text += this.syllable();
      }
    }

    if (options && options.capitalize) text = capitalize(text);

    return text;
  }

  /**
   * return a random sentence
   * @param options - the params
   */
  sentence(options?: SentenceOptions): string {
    const opts = initOptions(options, { words: this.natural({ min: 12, max: 18 }), punctuation: true });

    const { words, punctuation } = opts;
    const wordArray = this.n(this.word, words);
    let text: string;
    text = wordArray.join(' ');
    // Capitalize first letter of sentence
    text = capitalize(text);

    // Make sure punctuation has a usable value
    if (punctuation === true) {
      text += this.pickone(this.database.sentence.punctuations.split(''));
    } else if (typeof punctuation === 'string') {
      text += punctuation;
    }

    return text;
  }

  /**
   * return a random paragraph
   * @param options - the params
   */
  paragraph(options?: ParagraphOptions): string {
    const { sentences } = initOptions(options, { sentences: this.natural({ min: 3, max: 7 }) });
    const sentenceArray = this.n(this.sentence, sentences, { punctuation: '.' });
    return sentenceArray.join(' ');
  }

  /**
   * return a random english name
   *
   * @param options - the params
   */
  name(options?: Person): string {
    return `${this.firstname(options)} ${this.lastname()}`;
  }

  /**
   * return a random english last name
   */
  lastname(): string {
    return this.pickone(this.database.lastNames);
  }

  /**
   * return a random english first name
   * @param options - the params
   */
  firstname(options?: Person): string {
    const { gender } = initOptions(options, {});
    assert(gender && gender !== 'female' && gender !== 'male', 'grend must be one of female or male');
    const { male, female } = this.database.firstNames;
    const pool: string[] = gender ? this.database.firstNames[gender] : ([] as string[]).concat(male).concat(female);
    return this.pickone(pool);
  }

  /**
   * return a random chinese name
   * @param options - the params
   */
  cname(options?: Person): string {
    return `${this.cfirstname()}${this.clastname(options)}`;
  }

  /**
   * return a random chinese first name
   */
  cfirstname(): string {
    return this.pickone(this.database.cfirst);
  }

  /**
   * return a random chinese last name
   * @param options - the params
   */
  clastname(options?: CLastNameOptions): string {
    const { length, gender } = initOptions(options, { length: this.natural({ min: 1, max: 2 }) });
    assert(gender && gender !== 'female' && gender !== 'male', 'grend must be one of female or male');
    const { male, female } = this.database.clast;
    const pool = gender ? this.database.clast[gender] : male + female;
    return this.pickset(pool.split(''), length).join('');
  }

  /**
   * return a random chinese character
   */
  ccharacter(options?: CCharacterOptions): string {
    const { pool } = initOptions(options, {});
    return this.pickone((pool || this.database.cCharacter.chars).split(''));
  }

  /**
   * return a random chinese word
   * @param options - the params
   */
  cword(options?: CWordOption): string {
    const { length } = initOptions(options, { length: this.natural({ min: 2, max: 6 }) });
    return this.n(this.ccharacter, length, options).join('');
  }

  /**
   * return a random chinese sentence
   * @param options - the params
   */
  csentence(options?: Interval): string {
    const opts = initOptions(options, { min: 10, max: 18 });
    const length = this.natural(opts);
    return `${this.n(this.cword, length).join('')}。`;
  }

  /**
   * return a random chinese paragraph
   * @param options - the params
   */
  cparagraph(options?: Interval): string {
    const opts = initOptions(options, { min: 3, max: 18 });
    const length = this.natural(opts);
    return this.n(this.csentence, length).join('');
  }

  /**
   * return a random phone number
   * @param options - the params
   */
  phone(options?: PhoneOptions): string {
    const { mobile, formatted, asterisk, startNum } = initOptions(options, {
      mobile: true,
      formatted: false,
      asterisk: false,
      startNum: '',
    });

    let exp: RegExp;
    if (mobile) {
      // add **** in mobile numbers
      if (asterisk) {
        // specify the first three digits
        if (startNum.length === 3) {
          exp = formatted ? new RegExp(`${startNum}-\\*{4}-\\d{4}`) : new RegExp(`${startNum}\\*{4}\\d{4}`);
        } else {
          exp = formatted ? /1[345789]\d-\*{4}-\d{4}/ : /1[345789]\d\*{4}\d{4}/;
        }
      } else if (startNum.length === 3) {
        exp = formatted ? new RegExp(`${startNum}-\\d{4}-\\d{4}`) : new RegExp(`${startNum}\\d{8}`);
      } else {
        exp = formatted ? /1[345789]\d-\d{4}-\d{4}/ : /1[345789]\d{9}/;
      }
    } else if (asterisk) {
      // add ** or *** in landline numbers
      if (startNum.length === 3) {
        exp = formatted
          ? new RegExp(`${startNum}-\\d{3}\\*{2,3}\\d{2}`)
          : new RegExp(`${startNum}\\d{3}\\*{2,3}\\d{2}`);
      } else {
        exp = formatted ? /\d{3,4}-\d{3}\*{2,3}\d{2}/ : /\d{3,4}\d{3}\*{2,3}\d{2}/;
      }
    } else if (startNum.length === 3) {
      exp = formatted ? new RegExp(`${startNum}-\\d{7,8}`) : new RegExp(`${startNum}\\d{7,8}`);
    } else {
      exp = formatted ? /\d{3,4}-\d{7,8}/ : /\d{10,12}/;
    }

    return this.randexp(exp);
  }

  /**
   * return a random chinese zodiac
   * @param options - the params
   *
   * @example
   * ```javascript
   * const R = new TextRandom();
   * const cZodiacCn = R.cZodiac(); // '鼠', '牛', '虎'...
   * const cZodiacEn = R.cZodiac({ locale: 'en-US' }); // 'Rat','OX','Tiger'...
   * ```
   */
  cZodiac(options?: CZodiacOptions): string {
    const { locale } = initOptions(options, { locale: 'zh-CN' });
    const list: any[] = this.database.cZodiac[locale] || this.database.cZodiac['zh-CN'];
    return this.pickone(list);
  }
}

/**
 * @public
 */
export interface CharacterOptions {
  pool?: string;
  numeric?: boolean;
  symbols?: boolean;
  lower?: boolean;
  upper?: boolean;
}
/**
 * @public
 */
export interface StringOptions extends CharacterOptions {
  length?: number;
}

/**
 * @public
 */
export interface SyllableOptions {
  capitalize?: boolean;
  length?: number;
}

/**
 * @public
 */
export interface WordOptions {
  syllables?: number;
  /** 是否大写第一个字母 */
  capitalize?: boolean;
  /** the length of word */
  length?: number;
}

/** @public */
export interface SentenceOptions {
  /** the counts of word */
  words?: number;
  punctuation?: boolean | string;
}

/** @public */
export interface ParagraphOptions {
  /** the counts of sentence in the paragraph */
  sentence?: number;
}

/** @public */
export interface Person {
  /** 性别 */
  gender?: 'male' | 'female';
}

/** @public */
export interface CLastNameOptions extends Person {
  length?: number;
}

/** @public */
export interface CCharacterOptions {
  pool?: string;
}
/** @public */
export interface CWordOption extends CCharacterOptions {
  length?: number;
}

/** @public */
export interface PhoneOptions {
  /** true: mobile numbers; false: landline numbers */
  mobile?: boolean;
  /** true: add '-' to format phone numbers */
  formatted?: boolean;
  /** true: add '*' to avoid generating real phone numbers */
  asterisk?: boolean;
  /** only the first three digits can be specified, otherwise it is invalid */
  startNum?: string;
}

/** @public */
export interface CZodiacOptions {
  locale?: string;
}
