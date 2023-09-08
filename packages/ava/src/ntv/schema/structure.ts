import type { CommonProps, CustomBlockElement, BlockMetaData } from './common';
import type { PhraseSpec } from './phrase';
import type { ParagraphSpec } from './paragraph';

export type NarrativeTextSpec = CommonProps & {
  headline?: HeadlineSpec;
  sections?: SectionSpec[];
};

export type HeadlineSpec = CommonProps & {
  type: 'headline';
  phrases: PhraseSpec[];
};

export type StandardSectionSpec = CommonProps & {
  paragraphs?: ParagraphSpec[];
  metadata?: BlockMetaData;
};

export type SectionSpec = StandardSectionSpec | CustomBlockElement;
