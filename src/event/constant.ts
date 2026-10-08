/**
 * Engine lifecycle events.
 */
export enum LifecycleEventType {
  CREATE_START = 'createstart',
  CREATE_END = 'createend',
  DISPOSE_START = 'disposestart',
  DISPOSE_END = 'disposeend',
}

/**
 * Analysis events.
 */
export enum AnalysisEventType {
  TRANSLATE_START = 'translatestart',
  TRANSLATE_END = 'translateend',
  QUERY_START = 'querystart',
  QUERY_END = 'queryend',
  SUMMARIZE_START = 'summarizestart',
  SUMMARIZE_END = 'summarizeend',
  SELECT_CONTEXT_START = 'selectcontextstart',
  SELECT_CONTEXT_END = 'selectcontextend',
  REASON_START = 'reasonstart',
  REASON_END = 'reasonend',
}

/**
 * Data processing events.
 */
export enum ExecutionEventType {
  LOAD_START = 'loadstart',
  LOAD_END = 'loadend',
  PROFILE_START = 'profilestart',
  PROFILE_END = 'profileend',
  ANALYZE_START = 'analyzestart',
  ANALYZE_END = 'analyzeend',
  VISUALIZE_START = 'visualizestart',
  VISUALIZE_END = 'visualizeend',
  SUGGEST_START = 'suggeststart',
  SUGGEST_END = 'suggestend',
}
