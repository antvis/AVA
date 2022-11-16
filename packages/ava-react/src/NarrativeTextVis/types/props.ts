import type { NtvTypes } from '@antv/ava';
import type { PluginManager } from '../chore/plugin';

export type PhraseType = 'text' | NtvTypes.EntityType | null;

export type ThemeProps = {
  /**
   * @description size of text
   * @description.zh-CN 文本大小
   */
  size?: 'normal' | 'small';
};

export type ExtensionProps = {
  /**
   * @description extension plugin
   * @description.zh-CN 扩展插件
   */
  pluginManager?: PluginManager;
};

export type PhraseEvents = Partial<{
  onClickPhrase: (spec: NtvTypes.PhraseSpec) => void;
  onMouseEnterPhrase: (spec: NtvTypes.PhraseSpec) => void;
  onMouseLeavePhrase: (spec: NtvTypes.PhraseSpec) => void;
}>;

type NormalParagraphSpec = NtvTypes.HeadlineSpec | NtvTypes.ParagraphSpec | NtvTypes.BulletItemSpec;
export type ParagraphEvents = PhraseEvents &
  Partial<{
    onClickParagraph: (spec: NormalParagraphSpec) => void;
    onMouseEnterParagraph: (spec: NormalParagraphSpec) => void;
    onMouseLeaveParagraph: (spec: NormalParagraphSpec) => void;
  }>;

export type SectionEvents = ParagraphEvents &
  Partial<{
    onClickSection: (spec: NtvTypes.SectionSpec) => void;
    onMouseEnterSection: (spec: NtvTypes.SectionSpec) => void;
    onMouseLeaveSection: (spec: NtvTypes.SectionSpec) => void;
  }>;

export type NarrativeEvents = SectionEvents &
  Partial<{
    onClickNarrative: (spec: NtvTypes.NarrativeTextSpec) => void;
    onMouseEnterNarrative: (spec: NtvTypes.NarrativeTextSpec) => void;
    onMouseLeaveNarrative: (spec: NtvTypes.NarrativeTextSpec) => void;
    onCopySuccess: (e?: ClipboardEvent) => void;
    onCopyFailure: (e?: ClipboardEvent) => void;
  }>;
