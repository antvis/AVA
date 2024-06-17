import type { Data } from '@antv/g2';
import type { Advice, ScoringResultForChartType, AdvisorPipelineContext } from './pipeline';
import type { BasicDataPropertyForAdvice } from '../ruler';
import type { ChartId } from '../../ckb';

export type PipelineStageType = 'dataAnalyze' | 'chartTypeRecommend' | 'encode' | 'specGenerate';

/** 基础插件接口定义 */
export interface AdvisorPluginType<Input = any, Output = any> {
  /** 插件的唯一标识 */
  name: string;
  /** 插件运行的阶段，用于指定插件在 pipeline 的哪个环节运行 * */
  stage?: PipelineStageType | PipelineStageType[];
  type?: 'async' | 'sync';
  execute: (data: Input, context: AdvisorPipelineContext) => Output | Promise<Output>;
  /** 判断插件运行的条件 */
  condition?: (data?: Input, context?: AdvisorPipelineContext) => boolean | Promise<boolean>;
  // hooks
  onBeforeExecute?: (input: Input, context: AdvisorPipelineContext) => void | Promise<void>;
  onAfterExecute?: (output: Output, context: AdvisorPipelineContext) => void | Promise<void>;
  onLoad?: (context: AdvisorPipelineContext) => void | Promise<void>;
  onUnload?: (context: AdvisorPipelineContext) => void | Promise<void>;
}

export type DataProcessorInput = {
  data: Data;
  customDataProps?: BasicDataPropertyForAdvice[];
};

export type DataProcessorOutput = {
  data: Data;
  dataProps: BasicDataPropertyForAdvice[];
};

export type ChartTypeRecommendInput = {
  dataProps: BasicDataPropertyForAdvice[];
};

export type ChartTypeRecommendOutput = { chartTypeRecommendations: ScoringResultForChartType[] };

export type VisualEncoderInput = {
  data: Data;
  dataProps: BasicDataPropertyForAdvice[];
  chartType?: string;
  chartTypeRecommendations?: ScoringResultForChartType[];
};

export type ChartEncodeMapping = {
  x?: string[];
  y?: string[];
  color?: string[];
  size?: string[];
  [key: string]: string[];
};

export type VisualEncoderOutput = {
  encode?: ChartEncodeMapping;
  chartTypeRecommendations?: (ScoringResultForChartType & { encode?: ChartEncodeMapping })[];
};

export type SpecGeneratorInput = {
  data: Data;
  dataProps: BasicDataPropertyForAdvice[];
  encode?: ChartEncodeMapping;
  chartType?: ChartId;
  // todo 实际上不应该需要 score 信息
  chartTypeRecommendations: (ScoringResultForChartType & { encode?: ChartEncodeMapping })[];
};

export type SpecGeneratorOutput = {
  advices: (Omit<Advice, 'spec'> & {
    spec: Record<string, any> | null;
  })[];
};
