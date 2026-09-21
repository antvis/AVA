import { directAnalysis } from './direct';

import type { AnalysisConfig, AnalysisResponse, AnalysisRuntime } from '../types';

export function analyze(query: string, config: AnalysisConfig, runtime: AnalysisRuntime): Promise<AnalysisResponse> {
  const strategy = config.strategy?.type ?? 'direct';
  const executionOptions = { maxRows: config.maxRows };

  switch (strategy) {
    case 'direct':
      return directAnalysis(query, { ...runtime, executionOptions });
    default:
      throw new Error(`Unknown analysis strategy: ${strategy}`);
  }
}
