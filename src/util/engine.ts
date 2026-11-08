import { safeModelError } from './error';
import { sourceErrorContext, safeSourceError } from './source-error';

import type { AnalysisEngine, DataSourceConfig } from '../types';

/** One boundary per loaded source; in-flight calls retain its policy through disposal or reload. */
export function engineOperations(engine: AnalysisEngine, source: DataSourceConfig): AnalysisEngine {
  const context = sourceErrorContext(source);
  async function sourceOperation<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      throw safeSourceError(error, context);
    }
  }

  return {
    dialect: engine.dialect,
    load: (config) => sourceOperation(() => engine.load(config)),
    schema: () => sourceOperation(() => engine.schema()),
    profile: engine.profile ? (schema, options) => sourceOperation(() => engine.profile!(schema, options)) : undefined,
    // Registered engines may use providers other than AVA's generateText boundary.
    getDSL: async (query, model) => {
      try {
        return await engine.getDSL(query, model);
      } catch (error) {
        throw safeModelError(error);
      }
    },
    execute: (dsl, options) => sourceOperation(() => engine.execute(dsl, options)),
    dispose: () => sourceOperation(() => engine.dispose()),
  };
}
