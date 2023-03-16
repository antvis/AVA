import type { NtvTypes, NtvPluginType } from '@antv/ava-react';
import type { CSSProperties, ReactNode } from 'react';
import type { Tool } from './Toolbar/types';
// TODO @chenluli export form insight module
import type { InsightInfo, InsightType, PatternInfo } from '@antv/ava/lib/insight/types';

export type CardType = 'mini' | 'standard' | 'expand' | 'detail';

export type CommonProps = {
  styles?: CSSProperties;
  className?: string;
};

/**
 * @description basic info of an insight
 * @description.zh-CN 洞察的基本信息
 */
export type InsightData = Omit<InsightInfo, 'patterns' | 'visualizationSchemas'> & {
  /**
   * unique id of insight, used to identify the insight if you want to find or modify it 洞察的唯一标识，用于需要对洞察识别、修改时能溯源到是哪个洞察
   */
  insightId?: string;
  /**
   * analysis result data, if not defined, will be referred by algorithms. One of `algorithms` and `patterns` must be assigned
   * 分析得到的洞察数据，`algorithms` 和 `patterns` 至少有一个必须被赋值
   */
  patterns?: PatternInfo[];
  /** algorithms used to generate the insight, one of `algorithms` and `patterns` must be assigned */
  algorithms?: InsightType[];
  /** function for customizing content */
  customContentSpecGenerator?: (
    insightMeta: InsightInfo,
    defaultSpec: NtvTypes.NarrativeTextSpec
  ) => NtvTypes.NarrativeTextSpec;
};

/** events that may be emitted by card */
export type InsightCardEventHandlers = {
  /** events emitted when the card content copied */
  onCopy?: (insight: InsightData, dom?: HTMLElement) => void;
  /** events emitted when the card expose */
  onCardExpose?: (insight: InsightData, dom?: HTMLElement) => void;
  /** events emitted when insight data change */
  onChange?: (insight?: InsightData) => void;
};

export type InsightCardProps = CommonProps &
  InsightData &
  InsightCardEventHandlers & {
    /** title of insight card, analysis name and measure name by default 洞察卡片的标题，默认为一个分析类型+分析指标名称 */
    title?: ((defaultTitle: ReactNode) => ReactNode) | ReactNode;
    /** tools in the header of card, by default, there are no tools 标题右侧的工具栏 */
    headerTools?: Tool[];
    /** tools in the footer of card, by default, there are copy and share tools */
    footerTools?: Tool[];
    /** ntv schema 中，自己定制的 plugins */
    extraPlugins?: NtvPluginType[];
  };

export type InsightDataStatus = 'RUNNING' | 'SUCCESS' | 'ERROR';
