import type { Data } from '@antv/g2';
import type { Advice, ScoringResultForChartType, AdvisorPipelineContext } from './pipeline';
import type { BasicDataPropertyForAdvice } from '../ruler';
import type { ChartId } from '../../ckb';
import type { MarkEncode } from './mark';

/** 基础插件接口定义 */
export interface AdvisorPluginType<Input = any, Output = any> {
  /** 插件的唯一标识 */
  name: string;
  type?: 'async' | 'sync';
  /** 插件所属的模块 * */
  componentName?: string;
  execute: (input: Input, context: AdvisorPipelineContext) => Output | Promise<Output>;
  /** 判断插件运行的条件 */
  condition?: (input?: Input, context?: AdvisorPipelineContext) => boolean;
  // hooks
  onBeforeExecute?: (input: Input, context: AdvisorPipelineContext) => void;
  onAfterExecute?: (output: Output, context: AdvisorPipelineContext) => void;
  onLoad?: (context: AdvisorPipelineContext) => void;
  onUnload?: (context: AdvisorPipelineContext) => void;
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

export type SpecGeneratorInput = {
  // todo 实际上不应该需要 score 信息
  chartTypeRecommendations: ScoringResultForChartType[];
  data: Data;
  dataProps: BasicDataPropertyForAdvice[];
  encode?: MarkEncode;
};
export type SpecGeneratorOutput = {
  advices: (Omit<Advice, 'spec'> & {
    spec: Record<string, any> | null;
  })[];
};

export type VisualEncoderInput = {
  chartType: ChartId;
  dataProps: BasicDataPropertyForAdvice[];
  chartTypeRecommendations: ScoringResultForChartType[];
};

export type VisualEncoderOutput = {
  encode?: MarkEncode;
  chartTypeRecommendations?: ScoringResultForChartType[];
};
