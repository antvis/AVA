import type { Data } from '@antv/g2';
import type { Advice, ScoringResultForChartType } from './pipeline';
import type { BasicDataPropertyForAdvice } from '../ruler';

export enum PipelineStage {
  dataAnalyze = 'dataAnalyze',
  chartRecommend = 'chartRecommend',
  specGenerate = 'specGenerate',
}

/** 数据处理环节输入
 * Input of Data process stage
 */
export type DataAnalyzeInput = {
  data: Data;
  customDataProps?: BasicDataPropertyForAdvice[];
};

export type DataAnalyzeOutput = {
  data: Data;
  dataProps: BasicDataPropertyForAdvice[];
};

export type ChartRecommendInput = {
  data?: Data;
  dataProps: BasicDataPropertyForAdvice[];
};

export type ChartEncodeMapping = {
  x?: string[];
  y?: string[];
  color?: string[];
  size?: string[];
  [key: string]: string[];
};

export type ChartConfig = {
  /** recommended chart type */
  chartType: string;
  /** recommended chart encode */
  encode: ChartEncodeMapping;
};

export type ChartRecommendationResult = Partial<ScoringResultForChartType> & ChartConfig;

export type ChartRecommendOutput = {
  chartConfigs: ChartRecommendationResult[];
};

export type SpecGenerateInput = {
  data: Data;
  dataProps: BasicDataPropertyForAdvice[];
  chartConfigs: ChartRecommendationResult[];
};

export type SpecGenerateOutput = {
  advices: (Omit<Advice, 'spec' | 'score'> & {
    spec: Record<string, any> | null;
    score?: number;
  })[];
};
