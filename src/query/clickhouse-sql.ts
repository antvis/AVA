import { generateText } from 'ai';

import { languageModel } from '../util/model';
import { stringifyDataModel } from '../util/data-model';

import type { TranslationResult, DataModel, LLMConfig, QueryDialect } from '../types';

export class ClickHouseSQLDialect implements QueryDialect {
  constructor(private readonly llmConfig: LLMConfig) {}

  async getDSL(query: string, dataModel: DataModel): Promise<TranslationResult> {
    // Identifier quoting, function casing and UNION scope follow the ClickHouse SQL reference.
    // https://clickhouse.com/docs/reference/syntax
    // https://clickhouse.com/docs/reference/statements/select/union
    const prompt = `You are a ClickHouse SQL expert. Given the following data model and user query, generate a SQL query to answer the question.

    Dataset Context:
    ${stringifyDataModel(dataModel)}

    User Query: ${query}

    Generate exactly one read-only SELECT query (WITH is allowed), without explanation or markdown formatting. Do not use INTO OUTFILE, FORMAT, PARALLEL WITH, or SETTINGS.
    Use the exact table references and column names from the data model, joining tables when needed. Quote identifier components separately with double quotes or backticks when needed; use single quotes for strings. Preserve function-name casing.
    For UNION, explicitly choose ALL or DISTINCT and align column order and types. To order or limit the combined UNION result, put the UNION in a subquery and apply ORDER BY or LIMIT to the outer SELECT.`;

    const { text, usage, finishReason } = await generateText({
      model: languageModel(this.llmConfig),
      maxRetries: this.llmConfig.maxRetries ?? 3,
      prompt,
    });

    if (finishReason !== 'stop' && finishReason !== 'other') {
      throw new Error(`ClickHouse SQL generation did not complete (${finishReason})`);
    }
    const trimmed = text.trim();
    const dsl = (trimmed.match(/^```(?:sql)?[ \t]*\r?\n([\s\S]*?)\r?\n```$/i)?.[1] ?? trimmed).trim();
    if (!dsl) throw new Error('ClickHouse SQL generation returned an empty query');
    return { dsl, usage };
  }

  async validateDSL(sql: string): Promise<string> {
    // Keep the parser out of startup and SQL generation; load it on first validation.
    // AST node types and traversal: https://github.com/ClickHouse/clickhouse-js-parser
    const { parse, findNodes } = await import('@clickhouse/parser');
    const statements = parse(sql);
    // Include execution settings and output clauses inside nested queries and set operations.
    if (
      statements.length !== 1 ||
      statements[0].type !== 'SelectWithUnionQuery' ||
      findNodes(statements, 'Settings').length > 0 ||
      [
        ...findNodes(statements, 'SelectWithUnionQuery'),
        ...findNodes(statements, 'SelectIntersectExceptQuery'),
      ].some((node) => node.out_file !== undefined || node.format !== undefined)
    ) {
      throw new Error('ClickHouse query must contain exactly one read-only SELECT without SETTINGS or output clauses');
    }
    // Preserve source semantics: formatting can change UNION defaults or omit INTERSECT ALL.
    // The parser's statement span excludes the terminator, keeping row-limit wrapping valid.
    const { start, end } = statements[0].location;
    return sql.slice(start.offset, end.offset).trim();
  }
}
