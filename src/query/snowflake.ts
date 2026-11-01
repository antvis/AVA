import { generateText } from 'ai';

import { languageModel } from '../util/model';
import { stringifyDataModel } from '../util/data-model';

import type { DataModel, LLMConfig, QueryDialect, TranslationResult } from '../types';

/** Compiles SQL in Snowflake without running it; rejects with Snowflake's compilation error. */
export type SnowflakeCompiler = (sql: string) => Promise<void>;

const WORD = /[A-Za-z_][A-Za-z0-9_$]*/y;

/**
 * Scan a statement with Snowflake's lexical rules: `--` and `//` line comments, block comments,
 * single-quoted strings with '' and backslash escapes, $$-quoted strings and double-quoted
 * identifiers. Returns the bare words outside comments and literals, and where the statement's code
 * ends, excluding trailing comments, whitespace and semicolons.
 *
 * Block comments end at the first `*` + `/` and identifiers have no backslash escapes. Where Snowflake
 * might read either differently, this scan sees more code than Snowflake does, never less.
 */
export function scanStatement(sql: string): { words: string[]; end: number } {
  const words: string[] = [];
  const after = (marker: string, from: number) => {
    const index = sql.indexOf(marker, from);
    return index === -1 ? sql.length : index + marker.length;
  };
  let end = 0;
  let i = 0;
  while (i < sql.length) {
    const pair = sql.slice(i, i + 2);
    if (pair === '--' || pair === '//') {
      i = after('\n', i + 2);
      continue;
    }
    if (pair === '/*') {
      i = after('*/', i + 2);
      continue;
    }
    const char = sql[i];
    if (pair === '$$') {
      i = after('$$', i + 2);
    } else if (char === "'") {
      // A doubled quote reads as two adjacent literals, which scans the same way.
      for (i += 1; i < sql.length && sql[i] !== "'"; i += sql[i] === '\\' ? 2 : 1);
      i += 1;
    } else if (char === '"') {
      i = after('"', i + 1);
    } else {
      WORD.lastIndex = i;
      const word = WORD.exec(sql)?.[0];
      if (word) {
        words.push(word.toUpperCase());
        i += word.length;
      } else {
        i += 1;
        if (/[\s;]/.test(char)) continue;
      }
    }
    end = Math.min(i, sql.length);
  }
  return { words, end };
}

export class SnowflakeQueryDialect implements QueryDialect<SnowflakeCompiler> {
  constructor(private readonly llmConfig: LLMConfig) {}

  async getDSL(query: string, dataModel: DataModel): Promise<TranslationResult> {
    const prompt = `You are a SQL expert. Given the following dataset profile and user query, generate a SQL query to answer the question.

Dataset Context:
${stringifyDataModel(dataModel)}

User Query: ${query}

Generate exactly one read-only SELECT query (WITH is allowed), without explanation or markdown formatting. Reference the tables and fields by their exact names shown above (join tables when the question spans multiple tables). Use Snowflake SQL syntax. Enclose every table and column name in double quotes exactly as shown, because quoted Snowflake identifiers are case-sensitive. Do not call SYSTEM$ functions or procedures.`;

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
   * Snowflake has no read-only session mode, so a statement must be a query by construction. It must
   * compile as a subquery, which Snowflake accepts only for one query expression: DDL, DML, CALL,
   * scripting blocks and multiple statements fail to compile. Compiling (`describeOnly`) does not
   * run the query or use a warehouse.
   *
   * Two constructs pass that check and are refused beforehand: anonymous procedures
   * (`WITH p AS PROCEDURE ... CALL p()`), which Snowflake accepts and runs inside a subquery, and
   * SYSTEM$ functions, several of which change state and can be evaluated during compilation.
   *
   * The statement then runs unwrapped, because Snowflake does not keep a subquery's ORDER BY.
   * https://docs.snowflake.com/en/sql-reference/constructs/order-by#usage-notes
   */
  async validateDSL(sql: string, compile: SnowflakeCompiler): Promise<string> {
    const { words, end } = scanStatement(sql);
    const query = sql.slice(0, end).trim();
    if (!query) throw new Error('Snowflake query must be one read-only SELECT statement');
    if (/SYSTEM\$/i.test(query)) throw new Error('Snowflake SYSTEM$ functions are not allowed in analysis queries');
    if (words.includes('PROCEDURE') || words.includes('CALL')) {
      throw new Error('Snowflake procedures are not allowed in analysis queries');
    }
    // The newline lets a trailing line comment end before the closing parenthesis.
    await compile(`SELECT * FROM (${query}\n)`);
    return query;
  }
}
