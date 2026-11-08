import { generateText, languageModel } from '../util/model';
import { AVAError } from '../util/error';
import { stringifyDataModel } from '../util/data-model';

import type { DataModel, LLMConfig, PythonEngineOptions, QueryDialect, TranslationResult } from '../types';

export class PythonDialect implements QueryDialect {
  readonly id = 'python';

  // Bindings and result conversion are supplied by the Python engine.
  // https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.reset_index.html
  readonly rules = `Use Python 3 and pandas for analysis. pandas is available as pd. Input DataFrames are in tables, keyed by schema table name.
CSV/JSON use tables['data']; Excel exposes every sheet as tables['SheetName'].
For a single table, the DataFrame df is also available. For multiple sheets use tables explicitly.
Assign the final output to result: a DataFrame, Series, list of records, record, or JSON scalar.
DataFrame and Series indexes are not returned; use reset_index() when index values matter.
Each execution starts from fresh input data; variables and mutations do not persist between calls.
Do not read files, access the network, install packages, or print the answer.`;

  constructor(private readonly llmConfig: LLMConfig, private readonly execute?: PythonEngineOptions['execute']) {}

  async getDSL(query: string, dataModel: DataModel): Promise<TranslationResult> {
    const { text, usage, finishReason } = await generateText({
      model: languageModel(this.llmConfig),
      maxRetries: this.llmConfig.maxRetries ?? 3,
      prompt: `You are a data analysis expert. Generate Python code to answer the question.

Dataset Context:
${stringifyDataModel(dataModel)}

User Query: ${query}

${this.rules}

Return only executable Python code, without explanation or Markdown.`,
    });
    if (finishReason !== 'stop' && finishReason !== 'other') {
      throw new Error(`Python generation did not complete (${finishReason})`);
    }
    const dsl = text.trim().match(/^```(?:python|py)?[ \t]*\r?\n([\s\S]*?)\r?\n```$/i)?.[1] ?? text;
    if (!dsl.trim()) throw new Error('Python generation returned empty code');
    return { dsl, usage };
  }

  async validateDSL(code: string): Promise<string> {
    if (!code.trim()) throw new AVAError('QUERY_ERROR', 'Python query must contain code');
    if (code.includes('\0')) throw new AVAError('QUERY_ERROR', 'Python query contains a NUL character');
    // Compile in the execution environment without running the user's code or loading source data.
    // https://docs.python.org/3/library/functions.html#compile
    const script = `import json
compile(json.loads(${JSON.stringify(JSON.stringify(code))}), '<ava-query>', 'exec')
print('{"data":[],"schema":[],"rowCount":0}')
`;
    if (this.execute) {
      await this.execute(script);
    } else {
      const { createPythonExecutor } = await import('../interpreter/python/util/execute');
      await createPythonExecutor(30_000)(script, 64 * 1024);
    }
    return code;
  }
}
