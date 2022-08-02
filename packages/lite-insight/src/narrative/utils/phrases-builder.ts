import { PhraseSpec, EntityType } from '@antv/narrative-text-schema';

import { Language, InsightType, TrendType } from '../../interface';
import { SymbolType } from '../interface';
import { SYMBOL } from '../constance';

export function removeLastSpace(value: string) {
  const lastLetter = value.substr(value.length - 1);
  if (lastLetter === ' ') return value.substr(0, value.length - 1);
  return value;
}

export function getInsightTypeDesc(insightType: InsightType, lang: Language) {
  const INSIGHT_TYPE_MAP: Record<InsightType, string> = {
    category_outlier: '类别异常',
    change_point: '异常点',
    correlation: '相关性',
    low_variance: '低方差',
    majority: '显著性',
    trend: '趋势',
    time_series_outlier: '时间序列异常',
  };

  if (lang === 'en-US') {
    return insightType.replace('_', ' ');
  }
  if (lang === 'zh-CN') {
    return INSIGHT_TYPE_MAP[insightType];
  }
  return '';
}

export function getTrendDesc(trendType: TrendType, lang: Language) {
  const TREND_DESC_MAP: Record<TrendType, string> = {
    decreasing: '趋势下降',
    increasing: '趋势上升',
    'no trend': '无趋势',
  };
  if (lang === 'en-US') {
    return trendType;
  }
  if (lang === 'zh-CN') {
    return TREND_DESC_MAP[trendType];
  }
  return '';
}

const needRightSpaceSymbol: SymbolType[] = ['punctuation_right_parentheses', 'punctuation_comma', 'punctuation_stop'];
const needRemoveBeforeSpace: SymbolType[] = ['punctuation_comma', 'punctuation_stop', 'punctuation_right_parentheses'];

interface PhraseOption {
  leftSpace?: boolean;
  rightSpace?: boolean;
}

export class PhrasesBuilder {
  private schema: PhraseSpec[];

  private content: string;

  private lang: Language;

  // TODO 语言默认英文，之后再处理中文的情况
  constructor(lang: Language = 'en-US') {
    this.lang = lang;
    this.schema = [];
    this.content = '';
  }

  add(value: string, type?: EntityType, options: PhraseOption = { leftSpace: false, rightSpace: true }) {
    const { leftSpace = false, rightSpace = false } = options;
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
