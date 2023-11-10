import type { PhraseSpec } from './phrase';
import type { CommonProps, CustomBlockElement } from './common';

export type ParagraphSpec =
  | HeadingParagraphSpec
  | TextParagraphSpec
  | BulletsParagraphSpec
  | DividerParagraphSpec
  | CustomBlockElement;

// As nouns the difference between heading and headline is that
// heading is the title or topic of a document, article, chapter, or of a section thereof
// while headline is a heading or title of an article.
export type HeadingParagraphSpec = CommonProps & {
  type: 'heading1' | 'heading2' | 'heading3' | 'heading4' | 'heading5' | 'heading6';
  phrases: PhraseSpec[];
};

/**
 * indents 段落缩紧
 */
export type ParagraphIndent = {
  /** 缩进类型：参考 word 排版，包括：首行缩紧、左缩进、右缩进、 悬挂缩进（情况较少，暂不支持） */
  type: 'first-line' | 'left' | 'right';
  /** 缩进值，支持 css text-indent 值，比如 12px 20% 2em */
  length: string;
};

export type TextParagraphSpec = CommonProps & {
  type: 'normal';
  phrases: PhraseSpec[];
  indents?: ParagraphIndent[];
};

export type DividerParagraphSpec = CommonProps & {
  type: 'divider';
};

export type BulletsParagraphSpec = CommonProps & {
  type: 'bullets';
  isOrder: boolean;
  bullets: BulletItemSpec[];
};

export type BulletItemSpec = CommonProps & {
  type: 'bullet-item';
  phrases: PhraseSpec[];
  // nested list
  subBullet?: BulletsParagraphSpec;
};
