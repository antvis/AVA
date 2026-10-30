import type { AnalysisEngine, Operation } from '../../src';

declare const engine: AnalysisEngine;
const translate = (query: string, model: Parameters<AnalysisEngine['getDSL']>[1]): Operation<string> =>
  engine.getDSL(query, model);

// Async functions return a new plain Promise that does not carry operation events.
const wrapped = async (query: string, model: Parameters<AnalysisEngine['getDSL']>[1]) => translate(query, model);
// @ts-expect-error Plain promises cannot satisfy the engine operation contract.
const invalid: AnalysisEngine['getDSL'] = wrapped;
void invalid;

const wrappedLoad = async (config: Parameters<AnalysisEngine['load']>[0]) => engine.load(config);
// @ts-expect-error A wrapped load also loses its events channel.
const invalidLoad: AnalysisEngine['load'] = wrappedLoad;
void invalidLoad;
