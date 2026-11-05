import type { AnalysisEngine, QueryLanguage } from '../types';

export function getLanguageId(engine: AnalysisEngine): QueryLanguage {
  const id = engine.dialect?.id ?? engine.language;
  if (!id) throw new Error('Engine must provide a SQL dialect or a language id');
  return id;
}
