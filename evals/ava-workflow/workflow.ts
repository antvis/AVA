import type { AVA, AnalysisConfig, DataSourceConfig } from '../../lib/index.js';

export async function workflow(ava: AVA, source: DataSourceConfig, query: string, config: AnalysisConfig = {}) {
  await ava.source(source);
  await ava.profile();
  return ava.analyze(query, config);
}
