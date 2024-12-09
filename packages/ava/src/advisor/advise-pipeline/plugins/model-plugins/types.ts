import type { ChartRecommendOutput, AdviseResult } from '@advisor/types';
import type { HookParams1Type } from '@advisor/advise-pipeline/plugins/chart-recommend';
import type { PLUGIN_TYPE } from './constant';

export type ModelRequestFn<T = PLUGIN_TYPE> = T extends PLUGIN_TYPE.MODEL
  ? (payload: HookParams1Type) => Promise<ChartRecommendOutput>
  : (payload: ChartRecommendOutput) => Promise<ChartRecommendOutput>;
export type GenerateSelectFn = (input: Record<string, ChartRecommendOutput>) => AdviseResult;

export interface ModelRecommendPluginOptions<T = PLUGIN_TYPE> {
  name?: string;
  type?: T;
  request: ModelRequestFn<T>;
}

export interface ModelGeneratePluginOptions {
  name?: string;
  select: GenerateSelectFn;
}
