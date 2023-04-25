import type { NtvPluginType } from '../NarrativeTextVis';
import type { CSSProperties, ReactNode } from 'react';
import type { Tool } from './Toolbar/types';
import type { InsightInfo, InsightOptions, NarrativeTextSpec, InsightVisualizationOptions } from '@antv/ava';

export type CardType = 'mini' | 'standard' | 'expand' | 'detail';

export type CommonProps = {
  styles?: CSSProperties;
  className?: string;
};

/**
 * @description basic info of an insight
 * @description.zh-CN 洞察的基本信息
 */
export type InsightCardInfo = Pick<InsightInfo, 'dimensions' | 'measures' | 'data' | 'subspace'> & {
  /**
   * analysis result data
    分析得到的洞察数据
  */
  patterns?: InsightInfo['patterns'];
};

/** events that may be emitted by card */
export type InsightCardEventHandlers = {
  /** events emitted when the card content copied */
  onCopy?: (insightInfo?: InsightCardInfo, dom?: HTMLElement) => void;
  /** events emitted when the card expose */
  onCardExpose?: (insightInfo?: InsightCardInfo, dom?: HTMLElement) => void;
  /** events emitted when insight data change */
  onChange?: (insightInfo?: InsightCardInfo, contentSpec?: NarrativeTextSpec) => void;
};

export type InsightCardProps = CommonProps &
  InsightCardEventHandlers & {
    /** title of insight card, analysis name and measure name by default 洞察卡片的标题，默认为一个分析类型+分析指标名称 */
    title?: ((defaultTitle?: ReactNode) => ReactNode) | ReactNode;
    /** basic info of an insight, if not defined, will be referred by autoInsightOptions. One of `insightInfo` and `autoInsightOptions` must be assigned 洞察结果数据，如果不传入，需要通过配置`autoInsightOptions` 指定自动产生洞察结果的方式。`autoInsightOptions` 和 `insightInfo` 至少有一个必须被赋值 */
    insightInfo?: InsightCardInfo;
    /** tools in the header of card, by default, there are no tools 标题右侧的工具栏 */
    headerTools?: Tool[];
    /** tools in the footer of card, by default, there are copy and share tools */
    footerTools?: Tool[];
    /** [Note: this property is experimental and might be adjusted in the future version]. Options used to generate the insight, one of `autoInsightOptions` and `insightInfo` must be assigned */
    autoInsightOptions?: Omit<InsightOptions, 'visualization'> & {
      allData: { [x: string]: any }[];
    };
    visualizationOptions?: InsightVisualizationOptions;
    /** function for customizing content */
    customContentSpec?:
      | NarrativeTextSpec
      | ((insightInfo?: InsightCardInfo, defaultSpec?: NarrativeTextSpec) => NarrativeTextSpec);
    /** custom plugins, should pass if your customized schema includes special plugins ntv schema 中，自己定制的 plugins */
    extraPlugins?: NtvPluginType[];
  };

export type InsightDataStatus = 'RUNNING' | 'SUCCESS' | 'ERROR';
