import { AVAError } from '../util/error';

import { directAnalysis } from './direct';

import type { AnalysisConfig, AnalysisResponse, AnalysisRuntime } from '../types';

export function analyze(query: string, config: AnalysisConfig, runtime: AnalysisRuntime): Promise<AnalysisResponse> {
  const strategy = config.strategy?.type ?? 'direct';

  switch (strategy) {
    case 'direct':
      return directAnalysis(query, config, runtime);
    default:
      throw new AVAError('CONFIGURATION_ERROR', `Unknown analysis strategy: ${strategy}`);
  }
}
