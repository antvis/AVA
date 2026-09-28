import { defineEvalConfig } from 'eve/evals';

// Deterministic assertions only: no extra LLM judge or external reporter.
export default defineEvalConfig({ maxConcurrency: 1, timeoutMs: 180000 });
