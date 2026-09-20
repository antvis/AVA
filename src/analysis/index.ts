import { singleQueryAnalysis } from './single-query';

import type { AnalysisConfig, AnalysisResponse, AnalysisRuntime } from '../types';

export function analyze(query: string, config: AnalysisConfig, runtime: AnalysisRuntime): Promise<AnalysisResponse> {
  const strategy = config.strategy?.type ?? 'single-query';

  switch (strategy) {
    case 'single-query':
      return singleQueryAnalysis(query, runtime);
    default:
      throw new Error(`Unknown analysis strategy: ${strategy}`);
  }
}
