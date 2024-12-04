import { type ChartRecommendInput, type ChartRecommendOutput } from '../types';

export type ModelRequestFn = (input: ChartRecommendInput) => Promise<ChartRecommendOutput>;

export type ModelRequestFn2 = (input: ChartRecommendInput & ChartRecommendOutput) => Promise<ChartRecommendOutput>;

export type GenerateSelectFn = (input: Record<string, ChartRecommendOutput>) => ChartRecommendOutput;

export interface ModelRecommendPluginOptions {
  request?: ModelRequestFn;
  request2?: ModelRequestFn2;
}

export interface ModelGeneratePluginOptions {
  select: GenerateSelectFn;
}
