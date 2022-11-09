import type { PhraseSpec } from './phrase';
import type { CommonProps, CustomBlockElement } from './common';

export type ParagraphSpec = HeadingParagraphSpec | TextParagraphSpec | BulletsParagraphSpec | CustomBlockElement;

// As nouns the difference between heading and headline is that
// heading is the title or topic of a document, article, chapter, or of a section thereof
// while headline is a heading or title of an article.
export type HeadingParagraphSpec = CommonProps & {
  type: 'heading1' | 'heading2' | 'heading3' | 'heading4' | 'heading5' | 'heading6';
  phrases: PhraseSpec[];
};

export type TextParagraphSpec = CommonProps & {
  type: 'normal';
  phrases: PhraseSpec[];
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
