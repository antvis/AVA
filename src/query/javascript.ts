import { generateText } from 'ai';

import { languageModel } from '../util/model';
import { stringifyDataModel } from '../util/data-model';

import type { DataModel, LLMConfig, QueryDialect, TranslationResult } from '../types';

export class JavaScriptDialect implements QueryDialect {
  readonly id = 'javascript';

  readonly rules = `Code runs as a synchronous script with fresh copies of the loaded data. Assign the final output to a variable named result. Use the supplied data and helpers; avoid external files, network access and module loading.
You have access to a "data" array and a "stat" object with helper functions:
- stat.groupBy(arr, key) - Group array by key
- stat.sum(arr, key) - Sum values by key
- stat.avg(arr, key) - Average values by key
- stat.max(arr, key) - Max value by key
- stat.min(arr, key) - Min value by key
- stat.median(arr, key) - Median value by key
- stat.variance(arr, key) - Variance by key
- stat.stdDev(arr, key) - Standard deviation by key
- stat.distinct(arr, key) - Unique values by key
- stat.count(arr) - Count items
- stat.sortBy(arr, key, order) - Sort array ('asc' or 'desc')
- stat.filter(arr, predicate) - Filter array by condition
- stat.first(arr) - Get first element
- stat.last(arr) - Get last element

Examples:

1. Grouping and aggregation:
const grouped = stat.groupBy(data, 'region');
const result = Object.keys(grouped).map(region => ({
  region,
  avgRevenue: stat.avg(grouped[region], 'revenue'),
  totalSales: stat.sum(grouped[region], 'sales')
}));

2. Statistical analysis:
const result = {
  mean: stat.avg(data, 'value'),
  median: stat.median(data, 'value'),
  stdDev: stat.stdDev(data, 'value')
};

3. Filtering and sorting:
const filtered = stat.filter(data, item => item.score > 80);
const result = stat.sortBy(filtered, 'score', 'desc');

4. Finding unique values and counts:
const categories = stat.distinct(data, 'category');
const result = categories.map(cat => ({
  category: cat,
  count: stat.count(stat.filter(data, item => item.category === cat))
}));

5. Getting boundary elements:
const result = {
  firstEntry: stat.first(data),
  lastEntry: stat.last(data),
  topScorer: stat.first(stat.sortBy(data, 'score', 'desc'))
};`;

  constructor(private readonly llmConfig: LLMConfig) {}

  async getDSL(query: string, dataModel: DataModel): Promise<TranslationResult> {
    const { text, usage, finishReason } = await generateText({
      model: languageModel(this.llmConfig),
      maxRetries: this.llmConfig.maxRetries ?? 3,
      prompt: `You are a data analysis expert. Generate JavaScript code to answer the question.

Dataset Context:
${stringifyDataModel(dataModel)}

User Query: ${query}

${this.rules}

Return only executable JavaScript code, without explanation or Markdown.`,
    });
    if (finishReason !== 'stop' && finishReason !== 'other') {
      throw new Error(`JavaScript generation did not complete (${finishReason})`);
    }
    const trimmed = text.trim();
    const dsl = (trimmed.match(/^```(?:javascript|js)?[ \t]*\r?\n([\s\S]*?)\r?\n```$/i)?.[1] ?? trimmed).trim();
    if (!dsl) throw new Error('JavaScript generation returned empty code');
    return { dsl, usage };
  }

  async validateDSL(code: string): Promise<string> {
    if (!code.trim()) throw new Error('JavaScript query must contain code');
    return code;
  }
}
