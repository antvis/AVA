import { Language } from '../interface';

export const SYMBOL: Record<Language, { [key: string]: string }> = {
  'en-US': {
    punctuation_stop: '.',
    punctuation_comma: ',',
    punctuation_left_parentheses: '(',
    punctuation_right_parentheses: ')',
  },
  'zh-CN': {
    punctuation_stop: '。',
    punctuation_comma: '，',
    punctuation_left_parentheses: '（',
    punctuation_right_parentheses: '）',
  },
};
