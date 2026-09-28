import { generateText } from 'ai';

import { languageModel } from '../util/model';
import { stringifyProfile, stringifySchema } from '../util/context';

import type { ClickHouseClient } from '@clickhouse/client';
import type { DataContext, LLMConfig, QueryDialect } from '../types';

export class ClickHouseQueryDialect implements QueryDialect<ClickHouseClient> {
  constructor(private readonly llmConfig: LLMConfig) {}

  async getDSL(query: string, { schema, profile }: DataContext): Promise<string> {
    const prompt = `You are a SQL expert. Given the following dataset profile and user query, generate a SQL query to answer the question.

Dataset Context:
${profile ? stringifyProfile(profile) : stringifySchema(schema)}

User Query: ${query}

Generate exactly one read-only SELECT query (WITH is allowed), without explanation or markdown formatting. Do not use INTO OUTFILE, FORMAT, PARALLEL WITH, or SETTINGS. Reference the tables and fields by their exact names shown above (join tables when the question spans multiple tables). Use ClickHouse SQL syntax.`;

    const { text, usage } = await generateText({
      model: languageModel(this.llmConfig),
      maxRetries: this.llmConfig.maxRetries ?? 3,
      prompt,
    });
    this.llmConfig.onQueryUsage?.(usage);

    const trimmed = text.trim();
    return (trimmed.match(/^```(?:sql)?[ \t]*\r?\n([\s\S]*?)\r?\n```$/i)?.[1] ?? trimmed).trim();
  }

  async validateDSL(sql: string, client: ClickHouseClient): Promise<void> {
    await this.prepareQuery(sql, client);
  }

  /** Parse and normalize on the server; SQL is a parameter, never an executable suffix.
   * formatQuery rejects invalid/multiple statements and removes comments/terminators.
   * Parsing the normalized SQL as a subquery excludes DDL/DML and output clauses.
   * https://clickhouse.com/docs/sql-reference/functions/other-functions#formatQuery
   * https://clickhouse.com/docs/sql-reference/statements/select#syntax
   */
  async prepareQuery(sql: string, client: ClickHouseClient): Promise<string> {
    const result = await client.query({
      query: "SELECT formatQuery(concat('SELECT * FROM (', formatQuery({sql:String}), ')')) AS query",
      query_params: { sql },
      format: 'JSONEachRow',
      clickhouse_settings: { readonly: '1' },
    });
    const [row] = await result.json<{ query: string }>();
    if (!row?.query) throw new Error('Missing ClickHouse SQL validation result');
    // ClickHouse 24.8 applies subquery SETTINGS without enforcing readonly constraints.
    // Reject the native AST's Set nodes; tuning belongs in client configuration.
    // https://clickhouse.com/docs/sql-reference/statements/explain#explain-ast
    const ast = await client.query({
      query: `EXPLAIN AST ${row.query}`,
      format: 'TabSeparated',
      clickhouse_settings: { readonly: '1' },
    });
    const tree = await ast.text();
    if (!/^SelectWithUnionQuery\b/.test(tree.trimStart())) {
      throw new Error('Unexpected ClickHouse SELECT AST');
    }
    if (/^ *Set(?:\s|$)/m.test(tree)) {
      throw new Error('ClickHouse query SETTINGS are not allowed; use source connection options instead');
    }
    return row.query;
  }
}
