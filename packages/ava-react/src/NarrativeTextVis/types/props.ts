import type { ReactNode } from 'react';
import type { NtvTypes } from '@antv/ava';
import type { PluginManager } from '../chore/plugin';

export type PhraseType = 'text' | NtvTypes.EntityType | null;
export type ThemeType = 'light' | 'dark';
export type SizeType = 'normal' | 'small';

export type ThemeStylesProps = {
  /**
   * @description size of text
   * @description.zh-CN 文本大小
   * @default 'normal'
   */
  size?: SizeType;
  /**
   * @description theme
   * @description.zh-CN 主题颜色
   * @default 'light'
   */
  theme?: ThemeType;
};

export type CollapseConfig = {
  /**
   * show level line
   * 是否展示连接线
   */
  showBulletsLine: boolean;
  /**
   * custom switcher icon
   * 自定义展开/折叠图标
   */
  switcherIcon: (collapsed: boolean) => ReactNode;
  /**
   * controlled collapsed keys
   * 收起 key 受控
   */
  collapsedKeys?: string[];
  /**
   * collapse key change event
   * 收起事件
   */
  onCollapsed?: (
    collapsedKeys: string[]
    // TODO 其他参数视情况添加
    // info: {
    //   node: NtvTypes.ParagraphSpec;
    //   expanded: boolean;
    //   nativeEvent: MouseEvent;
    // }
  ) => void;
};

export type ExtensionProps = {
  /**
   * @description extension plugin
   * @description.zh-CN 扩展插件
   */
  pluginManager?: PluginManager;
  /**
   * Paragraph collapsible configuration
   * 是否允许收起
   */
  showCollapse?: boolean | Partial<CollapseConfig>;
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

export type NarrativeTextVisProps = ThemeStylesProps &
  ExtensionProps &
  NarrativeEvents & {
    /**
     * @description specification of narrative text spec
     * @description.zh-CN Narrative 描述 json 信息
     */
    spec: NtvTypes.NarrativeTextSpec;
    /**
     * @description the function to be called when copy event is listened. If it is undefined, the default behavior is to put the transformed html and plain text into user's clipboard
     * @description.监听到 copy 事件时执行的函数，可用于控制复制的内容和复制行为，如果不传，默认将会把转换后的富文本和纯文本内容放入剪切板
     */
    copyNarrative?: (content: { spec: NtvTypes.NarrativeTextSpec; plainText: string; html: string }) => void;
  };
