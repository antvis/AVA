import type { CommonProps, CustomBlockElement } from './common';
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

export type StandardSectionSpec = {
  paragraphs?: ParagraphSpec[];
};

export type SectionSpec = (StandardSectionSpec | CustomBlockElement) & CommonProps;

export type NestedParagraphSpec = CommonProps & {
  children: (ParagraphSpec | NestedParagraphSpec)[];
};
