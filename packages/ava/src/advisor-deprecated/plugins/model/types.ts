import type { ChartRecommendInput, ChartRecommendOutput, AdviseResult } from '@advisor-deprecated/types';
import type { PLUGIN_TYPE, TYPE_RESULT_CONST } from './constant';

export type ModelRequestFn = (payload: {
  input: ChartRecommendInput;
  output?: ChartRecommendOutput;
}) => Promise<ChartRecommendOutput>;

export type GenerateSelectFn = (
  result: Record<string, ChartRecommendOutput>,
  key?: typeof TYPE_RESULT_CONST
) => AdviseResult;

export interface ModelPluginOptions {
  types?: PLUGIN_TYPE[];
  request: ModelRequestFn;
  select: GenerateSelectFn;
}
