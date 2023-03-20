import type { NtvTypes, NtvPluginType } from '@antv/ava-react';
import type { CSSProperties, ReactNode } from 'react';
import type { Tool } from './Toolbar/types';
// TODO @chenluli export form insight module
import type { InsightInfo, InsightOptions, PatternInfo } from '@antv/ava/lib/insight/types';

export type CardType = 'mini' | 'standard' | 'expand' | 'detail';

export type CommonProps = {
  styles?: CSSProperties;
  className?: string;
};

/**
 * @description basic info of an insight
 * @description.zh-CN 洞察的基本信息
 */
export type InsightCardInfo = Omit<InsightInfo, 'score' | 'patterns' | 'visualizationSpecs'> & {
  /**
   * analysis result data, if not defined, will be referred by autoInsightOptions. One of `autoInsightOptions` and `patterns` must be assigned
    分析得到的洞察数据，`autoInsightOptions` 和 `patterns` 至少有一个必须被赋值
  */
  patterns?: PatternInfo[];
};

/** events that may be emitted by card */
export type InsightCardEventHandlers = {
  /** events emitted when the card content copied */
  onCopy?: (insightInfo?: InsightCardInfo, dom?: HTMLElement) => void;
  /** events emitted when the card expose */
  onCardExpose?: (insightInfo?: InsightCardInfo, dom?: HTMLElement) => void;
  /** events emitted when insight data change */
  onChange?: (insightInfo?: InsightCardInfo, contentSpec?: NtvTypes.NarrativeTextSpec) => void;
};

export type InsightCardProps = CommonProps &
  InsightCardEventHandlers & {
    /** basic info of an insight */
    insightInfo: InsightCardInfo;
    /** title of insight card, analysis name and measure name by default 洞察卡片的标题，默认为一个分析类型+分析指标名称 */
    title?: ((defaultTitle?: ReactNode) => ReactNode) | ReactNode;
    /** tools in the header of card, by default, there are no tools 标题右侧的工具栏 */
    headerTools?: Tool[];
    /** tools in the footer of card, by default, there are copy and share tools */
    footerTools?: Tool[];
    /** options used to generate the insight, one of `autoInsightOptions` and `patterns` must be assigned */
    autoInsightOptions?: Omit<InsightOptions, 'visualization' | 'dimensions' | 'measures'> & {
      allData: { [x: string]: any }[];
    };
    /** function for customizing content */
    customContentSpec?:
      | NtvTypes.NarrativeTextSpec
      | ((insightInfo?: InsightCardInfo, defaultSpec?: NtvTypes.NarrativeTextSpec) => NtvTypes.NarrativeTextSpec);
    /** custom plugins, should pass if your customized schema includes special plugins ntv schema 中，自己定制的 plugins */
    extraPlugins?: NtvPluginType[];
  };

export type InsightDataStatus = 'RUNNING' | 'SUCCESS' | 'ERROR';
