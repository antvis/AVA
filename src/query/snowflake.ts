import { generateText } from 'ai';

import { languageModel } from '../util/model';
import { stringifyDataModel } from '../util/data-model';

import type { DataModel } from '../contracts/data-model';
import type { LLMConfig } from '../config';
import type { QueryDialect, TranslationResult } from './types';

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
export function scanStatement(sql: string): {
  words: string[];
  end: number;
  systemFunction: boolean;
  dynamicFunction: boolean;
} {
  const words: string[] = [];
  const after = (marker: string, from: number) => {
    const index = sql.indexOf(marker, from);
    return index === -1 ? sql.length : index + marker.length;
  };
  const parentheses: boolean[] = [];
  let identifier: string | undefined;
  let resolvedIdentifier = false;
  let systemFunction = false;
  let dynamicFunction = false;
  let end = 0;
  let i = 0;
  while (i < sql.length) {
    const pair = sql.slice(i, i + 2);
    if (pair === '--' || pair === '//') {
      while (i < sql.length && !/[\r\n]/.test(sql[i])) i += 1;
      continue;
    }
    if (pair === '/*') {
      i = after('*/', i + 2);
      continue;
    }
    const char = sql[i];
    if (/\s/.test(char) || char === ';') {
      if (char === ';') {
        identifier = undefined;
        resolvedIdentifier = false;
      }
      i += 1;
      continue;
    }
    const previous = identifier;
    const resolved = resolvedIdentifier;
    identifier = undefined;
    resolvedIdentifier = false;
    if (pair === '$$') {
      i = after('$$', i + 2);
    } else if (char === "'") {
      // A doubled quote reads as two adjacent literals, which scans the same way.
      for (i += 1; i < sql.length && sql[i] !== "'"; i += sql[i] === '\\' ? 2 : 1);
      i += 1;
    } else if (char === '"') {
      const start = i;
      for (i += 1; i < sql.length; i += 1) {
        if (sql[i] !== '"') continue;
        if (sql[i + 1] === '"') {
          i += 1;
          continue;
        }
        i += 1;
        break;
      }
      identifier = sql
        .slice(start + 1, i - 1)
        .replace(/""/g, '"')
        .toUpperCase();
    } else {
      WORD.lastIndex = i;
      const word = WORD.exec(sql)?.[0];
      if (word) {
        identifier = word.toUpperCase();
        words.push(identifier);
        i += word.length;
      } else {
        if (char === '(') {
          systemFunction ||= previous?.startsWith('SYSTEM$') ?? false;
          // IDENTIFIER(...) can resolve a function name that is absent from the source text.
          dynamicFunction ||= resolved;
          parentheses.push(previous === 'IDENTIFIER');
        } else if (char === ')') {
          resolvedIdentifier = parentheses.pop() ?? false;
        }
        i += 1;
      }
    }
    end = Math.min(i, sql.length);
  }
  return { words, end, systemFunction, dynamicFunction };
}

export class SnowflakeQueryDialect implements QueryDialect {
  readonly id = 'snowflake-sql';
  readonly rules = `Use Snowflake SQL syntax and one read-only SELECT query (WITH is allowed).
  Reference the exact table and column names from the data model, joining tables when needed. Enclose identifier components in double quotes exactly as shown, because quoted Snowflake identifiers are case-sensitive; use single quotes for strings.
  Do not call SYSTEM$ functions, procedures, or dynamically resolved functions via IDENTIFIER(...)(...). Apply ORDER BY at the outermost level when result order matters.`;

  constructor(private readonly llmConfig: LLMConfig, private readonly compile: SnowflakeCompiler) {}

  async getDSL(query: string, dataModel: DataModel): Promise<TranslationResult> {
    const prompt = `You are a SQL expert. Given the following dataset profile and user query, generate a SQL query to answer the question.

Dataset Context:
${stringifyDataModel(dataModel)}

User Query: ${query}

${this.rules}
Generate exactly one query. Return only SQL text, without explanation or Markdown.`;

    const { text, usage, finishReason } = await generateText({
      model: languageModel(this.llmConfig),
      maxRetries: this.llmConfig.maxRetries ?? 3,
      prompt,
    });

    if (finishReason !== 'stop' && finishReason !== 'other') {
      throw new Error(`Snowflake SQL generation did not complete (${finishReason})`);
    }
    const trimmed = text.trim();
    const dsl = (trimmed.match(/^```(?:sql)?[ \t]*\r?\n([\s\S]*?)\r?\n```$/i)?.[1] ?? trimmed).trim();
    if (!dsl) throw new Error('Snowflake SQL generation returned an empty query');
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
  async validateDSL(sql: string): Promise<string> {
    const { words, end, systemFunction, dynamicFunction } = scanStatement(sql);
    const query = sql.slice(0, end).trim();
    if (!query) throw new Error('Snowflake query must be one read-only SELECT statement');
    if (systemFunction) throw new Error('Snowflake SYSTEM$ functions are not allowed in analysis queries');
    if (dynamicFunction) throw new Error('Snowflake dynamic function calls are not allowed in analysis queries');
    if (words.includes('PROCEDURE') || words.includes('CALL')) {
      throw new Error('Snowflake procedures are not allowed in analysis queries');
    }
    // The newline lets a trailing line comment end before the closing parenthesis.
    await this.compile(`SELECT * FROM (${query}\n)`);
    return query;
  }
}
