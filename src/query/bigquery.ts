import { generateText } from 'ai';

import { languageModel } from '../util/model';
import { stringifyDataModel } from '../util/data-model';

import type { DataModel, LLMConfig, QueryDialect, TranslationResult } from '../types';

/** Dry-run one statement in BigQuery and report its statement type without running it. */
export type BigQueryDryRun = (sql: string) => Promise<{ statementType?: string }>;

/** Execution conventions shared by direct query generation and the loop strategy prompt. */
export const BIGQUERY_INSTRUCTIONS = [
  'Write BigQuery GoogleSQL, not legacy SQL.',
  'Tables resolve in the default dataset of the source: reference them by the model names shown, without project or dataset qualifiers,',
  'and quote identifiers that contain characters other than letters, digits and underscores with backticks.',
  'Each statement must be one read-only query (SELECT, optionally with WITH); DML, DDL, scripts, EXPORT DATA and CALL are rejected before execution.',
  'BigQuery bills the bytes of the columns a query reads, and queries above the byte limit of the source fail:',
  'select only the columns you need and filter on partitioning columns when available.',
  'A model named like `events_*` is a wildcard over date-sharded tables: filter its _TABLE_SUFFIX column (YYYYMMDD) to read only the dates you need.',
  'Read ARRAY columns with UNNEST and STRUCT fields with dot notation.',
].join(' ');

export class BigQueryQueryDialect implements QueryDialect<BigQueryDryRun> {
  constructor(private readonly llmConfig: LLMConfig) {}

  async getDSL(query: string, dataModel: DataModel): Promise<TranslationResult> {
    const prompt = `You are a SQL expert. Given the following dataset profile and user query, generate a SQL query to answer the question.

Dataset Context:
${stringifyDataModel(dataModel)}

User Query: ${query}

Generate exactly one read-only SELECT query (WITH is allowed), without explanation or markdown formatting. Reference the tables and fields by their exact names shown above (join tables when the question spans multiple tables).
${BIGQUERY_INSTRUCTIONS}`;

    const { text, usage } = await generateText({
      model: languageModel(this.llmConfig),
      maxRetries: this.llmConfig.maxRetries ?? 3,
      prompt,
    });

    const trimmed = text.trim();
    const dsl = (trimmed.match(/^```(?:sql)?[ \t]*\r?\n([\s\S]*?)\r?\n```$/i)?.[1] ?? trimmed).trim();
    return { dsl, usage };
  }

  /**
   * BigQuery parses and plans the statement in a dry run, which never executes it or bills bytes.
   * Only the SELECT statement type is read-only; scripts report SCRIPT and are rejected as a whole.
   * https://cloud.google.com/bigquery/docs/running-queries#dry-run
   * https://cloud.google.com/bigquery/docs/reference/rest/v2/Job#JobStatistics2.FIELDS.statement_type
   */
  async validateDSL(sql: string, dryRun: BigQueryDryRun): Promise<string> {
    const { statementType } = await dryRun(sql);
    if (statementType !== 'SELECT') {
      throw new Error(
        `BigQuery query must be one read-only SELECT statement${statementType ? `, got ${statementType}` : ''}`
      );
    }
    return sql;
  }
}
