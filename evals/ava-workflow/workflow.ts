import type { AVA, AnalysisConfig, DataSourceConfig } from '../../lib/index.js';
import { createRunContext } from '../../lib/index.js';
import type { RunContext } from '../../lib/index.js';

export async function workflow(
  ava: AVA,
  source: DataSourceConfig,
  query: string,
  config: AnalysisConfig = {},
  parentRun?: RunContext
) {
  const run = createRunContext(parentRun);
  await ava.source(source, {}, run);
  await ava.profile();
  const result = await ava.analyze(query, config, run);
  const usage = run.usage.getUsage();
  return usage ? { ...result, usage } : result;
}
