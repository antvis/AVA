import type { Data } from '@antv/g2';
import type { Advice, ScoringResultForChartType, AdvisorPipelineContext } from './pipeline';
import type { BasicDataPropertyForAdvice } from '../ruler';
import type { ChartId } from '../../ckb';
import type { MarkEncode } from './mark';

export type PipelineStageType = 'dataAnalyze' | 'chartTypeRecommend' | 'encode' | 'specGenerate';

/** 基础插件接口定义 */
export interface PluginType<Input = any, Output = any> {
  /** 插件的唯一标识 */
  name: string;
  /** 插件运行的阶段，用于指定插件在 pipeline 的哪个环节运行 * */
  stage?: PipelineStageType | PipelineStageType[];
  execute: (data: Input, context: AdvisorPipelineContext) => Output | Promise<Output>;
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

export type ChartTypeRecommendInputParams = {
  dataProps: BasicDataPropertyForAdvice[];
};

export type ChartTypeRecommendOutput = { chartTypeRecommendations: ScoringResultForChartType[] };

export type SpecGeneratorInput = {
  // todo 实际上不应该需要 score 信息
  chartTypeRecommendations: ScoringResultForChartType[];
  data: Data;
  // 单独调用 SpecGenerator 时，还要额外计算 dataProps 么
  dataProps: BasicDataPropertyForAdvice[];
};
export type SpecGeneratorOutput = { advices: Advice[] };

export type VisualEncoderInput = {
  chartType: ChartId;
  dataProps: BasicDataPropertyForAdvice[];
};

export type VisualEncoderOutput = MarkEncode;
