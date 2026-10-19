import { integer } from '../_shared/args.js';
import type { AnalysisStrategyConfig } from '../../lib/index.js';

export function strategyConfig(values: Record<string, unknown>): AnalysisStrategyConfig {
  const type = values.strategy;
  if (type === 'direct') return { type, maxRetries: integer(values['max-retries'] ?? '2', 'max-retries', 0) };
  if (type === 'loop') return { type, maxSteps: integer(values['max-steps'] ?? '12', 'max-steps') };
  if (type === 'subset') return { type };
  if (type !== 'apex') throw new Error('--strategy must be direct, loop, subset or apex');
  const samples = integer(values.samples ?? '1', 'samples');
  const maxSteps = integer(values['max-steps'] ?? '40', 'max-steps', 2);
  const ablation = values.ablation as 'no-planning' | 'no-exploration' | 'no-guidance' | undefined;
  if (samples > 8 || maxSteps > 100) throw new Error('APEX supports at most 8 samples and 100 actions');
  if (ablation && !['no-planning', 'no-exploration', 'no-guidance'].includes(ablation))
    throw new Error('Unknown APEX ablation');
  return { type, samples, maxSteps, ...(ablation ? { ablation } : {}) };
}
