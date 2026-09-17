/**
 * Interpreter engine: JavaScript analysis over in-memory data.
 */
export { InterpreterEngine } from './engine';
export { executeCode } from './sandbox';
export { stat, STAT_OPS_PROMPT, STAT_OPS_EXAMPLE } from './stat';
export { loadSource } from './loaders';
export type { InterpreterSourceConfig } from './loaders';
