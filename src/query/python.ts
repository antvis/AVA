import { generateText } from 'ai';

import { languageModel } from '../util/model';
import { stringifyDataModel } from '../util/data-model';

import type { DataModel, LLMConfig, QueryDialect, TranslationResult } from '../types';

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

  constructor(private readonly llmConfig: LLMConfig) {}

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
    if (!code.trim()) throw new Error('Python query must contain code');
    if (code.includes('\0')) throw new Error('Python query contains a NUL character');
    // Strict mode raises on syntax errors rather than accepting a recovered editor tree.
    // https://github.com/lezer-parser/python
    // https://lezer.codemirror.net/docs/ref/#lr.ParserConfig.strict
    const { parser } = await import('@lezer/python');
    const tree = parser.configure({ strict: true }).parse(code);
    // The grammar tolerates initial indentation; Python top-level statements start at column zero.
    // https://docs.python.org/3/reference/lexical_analysis.html#indentation
    for (let node = tree.topNode.firstChild; node; node = node.nextSibling) {
      if (!node.type.is('Statement')) continue;
      const prefix = code.slice(code.lastIndexOf('\n', node.from - 1) + 1, node.from);
      if (/^[\t ]+$/.test(prefix)) throw new Error('Python query has unexpected top-level indentation');
    }
    return code;
  }
}
