/**
 * Engine registry: maps engine type names to their implementation classes.
 *
 * Each entry point (index.ts for Node.js, index.browser.ts for the browser)
 * registers the engines available in that environment. The AVA class looks up
 * the configured engine here, so the core class never imports any engine
 * implementation directly — Node-only engines (DuckDB, Supabase) stay out of
 * browser bundles.
 */

import type { DuckDBEngineOptions } from './duckdb/types';
import type { PythonEngineOptions } from './interpreter/python/types';
import type { QueryDialect, TranslationResult } from './query/types';
import type {
  DataSourceConfig,
  Schema,
  ProfileOptions,
  Profile,
  DataModel,
  ExecutionOptions,
  ExecutionResult,
} from './contracts';
import type { LLMConfig } from './config';

/** Constructor signature every engine class must satisfy. */
export type EngineClass = new (llmConfig: LLMConfig, options?: Record<string, unknown>) => AnalysisEngine;

const registry = new Map<EngineConfig['type'], EngineClass>();

/**
 * Register an engine class under its type name.
 * Called by entry points (index.ts / index.browser.ts) to expose the engines
 * available in that environment.
 */
export function registerEngine(type: EngineConfig['type'], engineClass: EngineClass): void {
  registry.set(type, engineClass);
}

/**
 * Look up the engine class for the given type. Throws if the type was not
 * registered in the current environment (e.g. DuckDB in a browser bundle).
 */
export function getEngineClass(type: EngineConfig['type']): EngineClass {
  const engineClass = registry.get(type);

  if (!engineClass) {
    throw new Error(
      `Engine type "${type}" is not available in this environment. ` +
        'The browser build of @antv/ava only includes the javascript engine; ' +
        'use the Node.js build for DuckDB, Supabase, ClickHouse, Snowflake, or Python.'
    );
  }

  return engineClass;
}

/**
 * Engine selection and per-engine options. The `type` discriminant picks the
 * analysis engine; the remaining fields are the options for that engine.
 * External SDK engines use their registered name and validate their own options.
 * Python defaults to local python3 execution; callers can supply their own execution environment.
 */
export type EngineConfig =
  | ({ type: 'duckdb' } & DuckDBEngineOptions)
  | ({ type: 'python' } & PythonEngineOptions)
  | { type: 'javascript' }
  | { type: 'supabase' }
  | { type: 'clickhouse' }
  | { type: 'sqlserver' }
  | { type: 'snowflake' }
  | { type: string; [option: string]: unknown };

/**
 * An analysis engine: loads a data source, turns natural-language queries
 * into its executable DSL (SQL) via LLM, and executes it.
 * Currently implemented by DuckDBEngine (duckdb/); kept as an interface
 * to allow alternative engines in the future.
 */
export interface AnalysisEngine {
  /** Query language, generation rules and validation supplied by every engine. */
  readonly dialect: QueryDialect;
  /** Load a data source and prepare it for execution. */
  load(config: DataSourceConfig): Promise<void>;
  /** Discover the loaded source structure. */
  schema(): Promise<Schema>;
  /** Compute statistics for the loaded data. */
  profile?(schema: Schema, options?: ProfileOptions): Promise<Profile>;
  /** Generate the executable DSL (SQL) for a natural-language query */
  getDSL(query: string, dataModel: DataModel): Promise<TranslationResult>;
  /** Execute one DSL statement with a bounded result. */
  execute<T = Record<string, unknown>>(dsl: string, options?: ExecutionOptions): Promise<ExecutionResult<T>>;
  /** Release resources (temp files, database connections) */
  dispose(): Promise<void>;
}
