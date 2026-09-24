import { generateText } from 'ai';

import { languageModel } from '../util/model';

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
export const directAnalysis: AnalysisStrategy = async (query, config, { context, engine, llm }) => {
  const maxRetries = Math.max(config.strategy?.type === 'direct' ? config.strategy.maxRetries ?? 2 : 10, 0);

  let sql = await engine.getDSL(query, context);
  let result: ExecutionResult;
  for (let attempt = 0; ; attempt++) {
    try {
      result = await engine.execute(sql, config);
      break;
    } catch (error) {
      if (attempt >= maxRetries) throw error;
      sql = await engine.getDSL(
        `${query}

        The previous DSL failed to execute. Correct it using the following diagnostic context:

        Previous DSL:
        ${sql}

        Execution error:
        ${error instanceof Error ? error.message : String(error)}`,
        context
      );
    }
  }
  const data = result.data;

  const summaryData = result.truncatedBy ? { data, truncated: true, truncatedBy: result.truncatedBy } : data;
  const text = config.includeSummary === false ? '' : await summarizeResult(query, summaryData, llm);

  return {
    query,
    ...result,
    sql,
    text,
  };
};
