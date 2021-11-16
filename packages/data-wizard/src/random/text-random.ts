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
    const opts = initOptions({ lower: true, upper: true, symbols: true, numeric: true }, options);
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
    const opts = initOptions({ length: this.natural({ min: 5, max: 20 }) }, options);

    assert(opts.length >= 0, 'Length cannot be less than zero.');

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
    const { length } = initOptions({ length: this.natural({ min: 2, max: 3 }) }, options);
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
   * return a random word
   * @param options - the params
   */
  word(options: WordOptions = {}): string {
    assert(!options.syllables || !options.length, 'Cannot specify both syllables AND length.');

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
    const opts = initOptions({ words: this.natural({ min: 12, max: 18 }), punctuation: true }, options);

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
    const { sentences } = initOptions({ sentences: this.natural({ min: 3, max: 7 }) }, options);
    const sentenceArray = this.n(this.sentence, sentences, { punctuation: '.' });
    return sentenceArray.join(' ');
  }

  /**
   * return a random english name
   *
   * @param options - the params
   */
  name(options?: Person): string {
    return `${this.givenName(options)} ${this.surname()}`;
  }

  /**
   * return a random english surname
   */
  surname(): string {
    return this.pickone(this.database.surname);
  }

  /**
   * return a random english given name
   * @param options - the params
   */
  givenName(options?: Person): string {
    const { gender } = initOptions({}, options);

    assert(!gender || gender === 'female' || gender === 'male', 'Gender must be one of female or male');

    const { male, female } = this.database.givenName;
    const pool: string[] = gender ? this.database.givenName[gender] : ([] as string[]).concat(male).concat(female);
    return this.pickone(pool);
  }

  /**
   * return a random phone number
   * @param options - the params
   */
  phone(options?: PhoneOptions): string {
    const { mobile, formatted, asterisk, startNum } = initOptions(
      {
        mobile: true,
        formatted: false,
        asterisk: false,
        startNum: '',
      },
      options
    );

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
   * return a random Chinese character
   */
  cCharacter(options?: CCharacterOptions): string {
    const { pool } = initOptions({}, options);
    return this.pickone((pool || this.database.cCharacter.chars).split(''));
  }

  /**
   * return a random Chinese word
   * @param options - the params
   */
  cWord(options?: CWordOption): string {
    const { length } = initOptions({ length: this.natural({ min: 2, max: 6 }) }, options);
    return this.n(this.cCharacter, length, options).join('');
  }

  /**
   * return a random Chinese sentence
   * @param options - the params
   */
  cSentence(options?: Interval): string {
    const opts = initOptions({ min: 10, max: 18 }, options);
    const length = this.natural(opts);
    return `${this.n(this.cWord, length).join('')}。`;
  }

  /**
   * return a random Chinese paragraph
   * @param options - the params
   */
  cParagraph(options?: Interval): string {
    const opts = initOptions({ min: 3, max: 18 }, options);
    const length = this.natural(opts);
    return this.n(this.cSentence, length).join('');
  }

  /**
   * return a random Chinese name
   * @param options - the params
   */
  cName(options?: Person): string {
    return `${this.cSurname()}${this.cGivenName(options)}`;
  }

  /**
   * return a random Chinese surname
   * @param options - the params
   */
  cSurname(): string {
    return this.pickone(this.database.cSurname);
  }

  /**
   * return a random Chinese given name
   */
  cGivenName(options?: CFirstNameOptions): string {
    const { length, gender } = initOptions({ length: this.natural({ min: 1, max: 2 }) }, options);

    assert(!gender || gender === 'female' || gender === 'male', 'Gender must be one of female or male');

    const { male, female } = this.database.cGivenName;
    const pool = gender ? this.database.cGivenName[gender] : male + female;
    return this.pickset(pool.split(''), length).join('');
  }

  /**
   * return a random Chinese zodiac
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
    const { locale } = initOptions({ locale: 'zh-CN' }, options);
    const list: any[] = this.database.cZodiac[locale];
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
  /** capitalize first letter */
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
export interface CFirstNameOptions extends Person {
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
  locale?: 'en-US' | 'zh-CN';
}
