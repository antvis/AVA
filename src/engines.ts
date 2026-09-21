/**
 * Engine registry: maps engine type names to their implementation classes.
 *
 * Each entry point (index.ts for Node.js, index.browser.ts for the browser)
 * registers the engines available in that environment. The AVA class looks up
 * the configured engine here, so the core class never imports any engine
 * implementation directly — Node-only engines (DuckDB, Supabase) stay out of
 * browser bundles.
 */

import { AVAError } from './util/error';

import type { AnalysisEngine, EngineConfig, LLMConfig } from './types';

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
 * Check whether an engine type has been registered.
 */
export function hasEngine(type: EngineConfig['type']): boolean {
  return registry.has(type);
}

/**
 * Look up the engine class for the given type. Throws if the type was not
 * registered in the current environment (e.g. DuckDB in a browser bundle).
 */
export function getEngineClass(type: EngineConfig['type']): EngineClass {
  const engineClass = registry.get(type);
  if (!engineClass) {
    throw new AVAError(
      'CONFIGURATION_ERROR',
      `Engine type "${type}" is not available in this environment. ` +
        'The browser build of @antv/ava only includes the interpreter engine; ' +
        'use the Node.js build for DuckDB or Supabase.'
    );
  }
  return engineClass;
}
