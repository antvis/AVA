import { generateText } from 'ai';

import { languageModel } from '../util/model';
import { stringifyProfile, stringifySchema } from '../util/context';

import type { DataContext, LLMConfig, QueryDialect } from '../types';

const READ_ONLY_PREFIXES = new Set(['SELECT', 'WITH']);
const MUTATING_KEYWORDS = new Set([
  'ALTER',
  'ATTACH',
  'BACKUP',
  'CHECK',
  'CREATE',
  'DELETE',
  'DETACH',
  'DROP',
  'EXCHANGE',
  'GRANT',
  'INSERT',
  'KILL',
  'OPTIMIZE',
  'RENAME',
  'RESTORE',
  'REVOKE',
  'SET',
  'SYSTEM',
  'TRUNCATE',
  'UPDATE',
  'USE',
]);

function stripLiteralsAndComments(sql: string): string {
  let out = '';
  let i = 0;
  while (i < sql.length) {
    const ch = sql[i];
    const next = sql[i + 1];
    if (ch === '-' && next === '-') {
      while (i < sql.length && sql[i] !== '\n') out += ' ', i += 1;
      continue;
    }
    if (ch === '/' && next === '*') {
      out += '  ';
      i += 2;
      while (i < sql.length) {
        if (sql[i] === '*' && sql[i + 1] === '/') {
          out += '  ';
          i += 2;
          break;
        }
        out += sql[i] === '\n' ? '\n' : ' ';
        i += 1;
      }
      continue;
    }
    if (ch === '\'') {
      out += ' ';
      i += 1;
      while (i < sql.length) {
        if (sql[i] === '\'') {
          out += ' ';
          i += 1;
          if (sql[i] === '\'') {
            out += ' ';
            i += 1;
            continue;
          }
          break;
        }
        out += sql[i] === '\n' ? '\n' : ' ';
        i += 1;
      }
      continue;
    }
    if (ch === '"' || ch === '`') {
      const quote = ch;
      out += ' ';
      i += 1;
      while (i < sql.length) {
        if (sql[i] === quote) {
          out += ' ';
          i += 1;
          if (sql[i] === quote && quote === '"') {
            out += ' ';
            i += 1;
            continue;
          }
          break;
        }
        out += sql[i] === '\n' ? '\n' : ' ';
        i += 1;
      }
      continue;
    }
    out += ch;
    i += 1;
  }
  return out;
}

function splitStatements(sql: string): string[] {
  const stripped = stripLiteralsAndComments(sql);
  const statements: string[] = [];
  let start = 0;
  for (let i = 0; i < stripped.length; i += 1) {
    if (stripped[i] !== ';') continue;
    const statement = sql.slice(start, i).trim();
    if (statement) statements.push(statement);
    start = i + 1;
  }
  const tail = sql.slice(start).trim();
  if (tail) statements.push(tail);
  return statements;
}

function keywordTokens(sql: string): string[] {
  return stripLiteralsAndComments(sql)
    .match(/[A-Za-z_][A-Za-z0-9_]*/g)
    ?.map((token) => token.toUpperCase()) ?? [];
}

export class ClickHouseQueryDialect implements QueryDialect {
  constructor(private readonly llmConfig: LLMConfig) {}

  async getDSL(query: string, { schema, profile }: DataContext): Promise<string> {
    const prompt = `You are a SQL expert. Given the following dataset profile and user query, generate a SQL query to answer the question.

Dataset Context:
${profile ? stringifyProfile(profile) : stringifySchema(schema)}

User Query: ${query}

Generate ONLY the SQL query without any explanation or markdown formatting. Reference the tables and fields by their exact names shown above (join tables when the question spans multiple tables). Use ClickHouse SQL syntax.`;

    const { text, usage } = await generateText({
      model: languageModel(this.llmConfig),
      maxRetries: this.llmConfig.maxRetries ?? 3,
      prompt,
    });
    this.llmConfig.onQueryUsage?.(usage);

    return text
      .trim()
      .replace(/^```(?:sql)?\s*|\s*```$/gi, '')
      .trim();
  }

  async validateDSL(sql: string): Promise<void> {
    const statements = splitStatements(sql);
    if (statements.length === 0) {
      throw new Error('ClickHouse query must contain exactly one read-only SELECT statement');
    }
    if (statements.length !== 1) {
      throw new Error('ClickHouse query must contain exactly one read-only SELECT statement');
    }

    const tokens = keywordTokens(statements[0]);
    const first = tokens[0];
    if (!first || !READ_ONLY_PREFIXES.has(first)) {
      throw new Error('ClickHouse query must contain only read-only SELECT statements');
    }
    if (tokens.some((token) => MUTATING_KEYWORDS.has(token))) {
      throw new Error('ClickHouse query must contain only read-only SELECT statements');
    }
    if (first === 'WITH' && !tokens.includes('SELECT')) {
      throw new Error('ClickHouse query must contain only read-only SELECT statements');
    }
  }
}
