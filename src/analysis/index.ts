import { directAnalysis } from './direct';
import { loopAnalysis } from './loop';

import type { AnalysisConfig, AnalysisResponse, AnalysisRuntime } from '../types';

export function analyze(query: string, config: AnalysisConfig, runtime: AnalysisRuntime): Promise<AnalysisResponse> {
  const strategy = config.strategy?.type ?? 'direct';

  switch (strategy) {
    case 'direct':
      return directAnalysis(query, config, runtime);
    case 'loop':
      return loopAnalysis(query, config, runtime);
    default:
      throw new Error(`Unknown analysis strategy: ${strategy}`);
  }
}
