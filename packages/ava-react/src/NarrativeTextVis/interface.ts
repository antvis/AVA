import {
  EntityType,
  NarrativeTextSpec,
  SectionSpec,
  ParagraphSpec,
  PhraseSpec,
  HeadlineSpec,
  BulletItemSpec,
} from '@antv/narrative-text-schema';
import { PluginManager } from './chore/plugin';

export type PhraseType = 'text' | EntityType | null;

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
  onClickPhrase: (spec: PhraseSpec) => void;
  onMouseEnterPhrase: (spec: PhraseSpec) => void;
  onMouseLeavePhrase: (spec: PhraseSpec) => void;
}>;

type NormalParagraphSpec = HeadlineSpec | ParagraphSpec | BulletItemSpec;
export type ParagraphEvents = PhraseEvents &
  Partial<{
    onClickParagraph: (spec: NormalParagraphSpec) => void;
    onMouseEnterParagraph: (spec: NormalParagraphSpec) => void;
    onMouseLeaveParagraph: (spec: NormalParagraphSpec) => void;
  }>;

export type SectionEvents = ParagraphEvents &
  Partial<{
    onClickSection: (spec: SectionSpec) => void;
    onMouseEnterSection: (spec: SectionSpec) => void;
    onMouseLeaveSection: (spec: SectionSpec) => void;
  }>;

export type NarrativeEvents = SectionEvents &
  Partial<{
    onClickNarrative: (spec: NarrativeTextSpec) => void;
    onMouseEnterNarrative: (spec: NarrativeTextSpec) => void;
    onMouseLeaveNarrative: (spec: NarrativeTextSpec) => void;
    onCopySuccess: (e?: ClipboardEvent) => void;
    onCopyFailure: (e?: ClipboardEvent) => void;
  }>;
