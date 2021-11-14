import { IPhrase, IEntityType } from '@antv/text-schema';
import { Language, SymbolType } from '../interface';
import { SYMBOL } from '../constance';

export function removeLastSpace(value: string) {
  const lastLetter = value.substr(value.length - 1);
  if (lastLetter === ' ') return value.substr(0, value.length - 1);
  return value;
}

const needRightSpaceSymbol: SymbolType[] = ['punctuation_right_parentheses', 'punctuation_comma', 'punctuation_stop'];
const needRemoveBeforeSpace: SymbolType[] = ['punctuation_comma', 'punctuation_stop', 'punctuation_right_parentheses'];

interface PhraseOption {
  leftSpace: boolean;
  rightSpace: boolean;
}

export class PhrasesBuilder {
  private schema: IPhrase[];

  private content: string;

  private lang: Language;

  // TODO 语言默认英文，之后再处理中文的情况
  constructor(lang: Language = 'en-US') {
    this.lang = lang;
    this.schema = [];
    this.content = '';
  }

  add(value: string, type?: IEntityType, options: PhraseOption = { leftSpace: false, rightSpace: true }) {
    const { leftSpace, rightSpace } = options;
    const newValue = this.lang === 'en-US' ? `${leftSpace ? ' ' : ''}${value}${rightSpace ? ' ' : ''}` : value;
    if (type) {
      if (leftSpace) {
        this.schema.push({
          type: 'text',
          value: ' ',
        });
      }
      this.schema.push({
        type: 'entity',
        value,
        metadata: {
          entityType: type,
        },
      });
      if (rightSpace) {
        this.schema.push({
          type: 'text',
          value: ' ',
        });
      }
    } else {
      this.schema.push({
        type: 'text',
        value: newValue,
      });
    }
    this.content += newValue;
  }

  addSymbol(symbol: SymbolType) {
    const value = SYMBOL?.[this.lang]?.[symbol];
    if (value) {
      if (this.lang === 'en-US' && needRemoveBeforeSpace.includes(symbol)) {
        // remove space before
        const beforePhrase = this.schema.pop();
        if (beforePhrase) {
          const beforeValue = removeLastSpace(beforePhrase.value);
          if (beforeValue) {
            beforePhrase.value = beforeValue;
            this.schema.push(beforePhrase);
          }
          this.content = removeLastSpace(this.content);
        }
      }
      this.add(value, undefined, { leftSpace: false, rightSpace: needRightSpaceSymbol.includes(symbol) });
    }
  }

  getSchema() {
    return this.schema;
  }

  getContent() {
    return this.content;
  }
}
