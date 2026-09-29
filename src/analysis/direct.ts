import { generateText } from 'ai';

import { languageModel } from '../util/model';
import { AnalysisEvent, AnalysisEventType } from '../util/event';
import { serializeError } from '../util/error';

import type { AnalysisStrategy, ExecutionResult, LLMConfig } from '../types';

async function summarizeResult(query: string, data: any, llm: LLMConfig): Promise<string> {
  const dataStr = typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data);

  const prompt = `You are a data analysis assistant. Based on the following query and analysis result, provide a clear and concise summary.

User Query: ${query}

Analysis Result:
${dataStr}

IMPORTANT: Detect the language of the user query. You MUST write your summary in the SAME language as the user query. For example, if the query is in Chinese, write the summary in Chinese; if in English, write in English; if in Japanese, write in Japanese. If the query language is ambiguous, default to English.

Provide a natural language summary of the result. If the result is tabular data, you can present it as a markdown table.`;

  const { text } = await generateText({
    model: languageModel(llm),
    maxRetries: llm.maxRetries ?? 3,
    prompt,
  });

  return text;
}

/** Generate and execute a query with bounded error correction, then summarize its data. */
export const directAnalysis: AnalysisStrategy = async (query, config, { context, engine, llm, emit }) => {
  const maxRetries = Math.max(config.strategy?.type === 'direct' ? config.strategy.maxRetries ?? 2 : 10, 0);

  let translationQuery = query;
  let sql: string;
  let result: ExecutionResult;

  for (let attempt = 0; ; attempt++) {
    emit(new AnalysisEvent(AnalysisEventType.TRANSLATE_START, { query: translationQuery }));

    try {
      sql = await engine.getDSL(translationQuery, context);
    } catch (error) {
      emit(new AnalysisEvent(AnalysisEventType.TRANSLATE_END, { error: serializeError(error) }));

      throw error;
    }

    emit(new AnalysisEvent(AnalysisEventType.TRANSLATE_END, { dsl: sql }));

    emit(new AnalysisEvent(AnalysisEventType.QUERY_START, { dsl: sql, options: config }));

    try {
      result = await engine.execute(sql, config);
    } catch (error) {
      emit(new AnalysisEvent(AnalysisEventType.QUERY_END, { error: serializeError(error) }));

      if (attempt >= maxRetries) throw error;

      translationQuery = `${query}

        The previous DSL failed to execute. Correct it using the following diagnostic context:

        Previous DSL:
        ${sql}

        Execution error:
        ${error instanceof Error ? error.message : String(error)}`;

      continue;
    }

    emit(new AnalysisEvent(AnalysisEventType.QUERY_END, result));

    break;
  }

  const data = result.data;

  let text = '';

  if (config.includeSummary !== false) {
    const summaryData = result.truncatedBy ? { data, truncated: true, truncatedBy: result.truncatedBy } : data;

    emit(new AnalysisEvent(AnalysisEventType.SUMMARIZE_START, { query, data: summaryData }));

    try {
      text = await summarizeResult(query, summaryData, llm);
    } catch (error) {
      emit(new AnalysisEvent(AnalysisEventType.SUMMARIZE_END, { error: serializeError(error) }));

      throw error;
    }

    emit(new AnalysisEvent(AnalysisEventType.SUMMARIZE_END, { text }));
  }

  return {
    query,
    ...result,
    sql,
    text,
  };
};
