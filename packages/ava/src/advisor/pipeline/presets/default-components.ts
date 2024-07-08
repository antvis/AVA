import { ChartEncoder } from './chart-encoder';
import { ChartTypeRecommender } from './chart-type-recommender';
import { DataAnalyzer } from './data-analyzer';
import { SpecGenerator } from './spec-generator';

import type { ComponentOptions } from '../component';

export const getPresetPipelineComponents = (options: ComponentOptions) => {
  return [
    new DataAnalyzer(options),
    new ChartTypeRecommender(options),
    new ChartEncoder(options),
    new SpecGenerator(options),
  ];
};
