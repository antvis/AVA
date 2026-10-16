/**
 * Semantic-layer agent (Think–Act loop):
 *
 * Every step the model returns exactly one tool call:
 *  - getModelDataElements: discover semantic models, dimensions, measures and join edges.
 *  - convertSmqToSql: deterministically compile an SMQ into trusted SQL and preview 5 rows.
 *  - execute: run the final SQL composed from the compiled fragments. Terminal, at most once.
 *
 * The agent never sees the raw physical schema; only tables introduced by compiled SMQs may be
 * used by the final SQL.
 */
import { generateText } from 'ai';

import { languageModel } from '../util/model';
import { AnalysisEvent, AnalysisEventType } from '../event';
import { serializeError } from '../util/error';
import { compileSMQ, inferDialect } from '../semantic/compiler';

import { summarizeResult } from './direct';

import type { AnalysisStrategy, ExecutionResult } from '../types';
import type { SMQ } from '../semantic/types';

const DEFAULT_MAX_STEPS = 20;
const PREVIEW_ROWS = 5;

type ToolCall = { tool: 'getModelDataElements' | 'convertSmqToSql' | 'execute'; args: Record<string, unknown> };

function parseToolCall(text: string): ToolCall {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(text)?.[1] ?? text;
  const candidates = [fenced.trim(), fenced.slice(fenced.indexOf('{'), fenced.lastIndexOf('}') + 1)];

  for (const candidate of candidates) {
    try {
      const value = JSON.parse(candidate);
      if (
        value &&
        ['getModelDataElements', 'convertSmqToSql', 'execute'].includes(value.tool) &&
        (value.args === undefined || (typeof value.args === 'object' && value.args !== null))
      ) {
        return { tool: value.tool, args: value.args ?? {} };
      }
    } catch {
      // try the next candidate
    }
  }

  throw new Error(
    'Response must be exactly one JSON tool call: {"tool": "getModelDataElements" | "convertSmqToSql" | "execute", "args": {...}}'
  );
}

/** Remove string literals and comments so structural scans cannot match their contents. */
function stripLiterals(sql: string): string {
  return sql
    .replace(/'(?:[^']|'')*'/g, "''")
    .replace(/--[^\n]*/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ');
}

function normalizeTable(name: string): string {
  return name.replace(/["`]/g, '').toLowerCase();
}

/** Physical tables in FROM/JOIN position that are neither CTEs nor in the allowed set. */
export function findDisallowedTables(sql: string, allowed: Set<string>): string[] {
  const text = stripLiterals(sql);
  const ctes = new Set(
    [...text.matchAll(/(?:\bWITH\s+(?:RECURSIVE\s+)?|,\s*)([A-Za-z_]\w*)\s+AS\s*(?:NOT\s+MATERIALIZED\s*|MATERIALIZED\s*)?\(/gi)].map(
      (m) => m[1].toLowerCase()
    )
  );
  const allowedNames = new Set<string>();
  for (const table of allowed) {
    allowedNames.add(table);
    allowedNames.add(table.split('.').pop()!);
  }

  const part = '(?:"[^"]+"|`[^`]+`|[A-Za-z_][\\w$]*)';
  const reference = new RegExp(`\\b(?:FROM|JOIN)\\s+(${part}(?:\\.${part})*)`, 'gi');
  const bad = new Set<string>();

  for (const match of text.matchAll(reference)) {
    // FROM inside EXTRACT(... FROM expr), TRIM(... FROM expr) and similar is not a table reference.
    let depth = 0;
    let open = -1;
    for (let i = match.index! - 1; i >= 0; i -= 1) {
      if (text[i] === ')') depth += 1;
      else if (text[i] === '(') {
        if (depth === 0) {
          open = i;
          break;
        }
        depth -= 1;
      }
    }
    if (open >= 0 && /\b(EXTRACT|TRIM|SUBSTRING|OVERLAY|POSITION)\s*$/i.test(text.slice(0, open))) continue;

    const name = normalizeTable(match[1]);
    if (ctes.has(name) || allowedNames.has(name) || allowedNames.has(name.split('.').pop()!)) continue;
    bad.add(match[1]);
  }

  return [...bad];
}

function systemPrompt(dialectName: string, instructions: string | undefined, includeSummary: boolean): string {
  return `You are a data analysis agent working through a semantic layer. Answer the user's question by composing one final SQL query.

# RESPONSE PROTOCOL

Every response is exactly one JSON tool call and nothing else:
{"tool": "<name>", "args": {...}}

# TOOLS

1. getModelDataElements — discover semantic models.
   args: {"models": ["<model>", ...]}   (omit "models" to list every model)
   Returns dimensions, measures, tables and join edges. Elements are named <model>__<name>.

2. convertSmqToSql — compile a Semantic Model Query into trusted SQL and preview ${PREVIEW_ROWS} rows.
   args: {"metrics": ["<measure>", ...], "filters": ["<model>__status = 'paid'"], "group_by": ["<dimension>", ...], "order_by": [{"field": "<selected element>", "direction": "desc"}], "limit": 10}
   - metrics must be measures, group_by must be dimensions.
   - filters are boolean expressions using =, !=, <, <=, >, >=, IN, NOT IN, LIKE, BETWEEN, IS [NOT] NULL, AND, OR, NOT. Filters on measures become HAVING.
   - Joins are resolved automatically from the join graph.
   Use it repeatedly to obtain verified SQL building blocks and to inspect real values.

3. execute — run the FINAL SQL and finish.
   args: {"sql": "<final query>"}
   - Terminal action: it can be used only once and ends the loop.
   - Compose the final SQL from the SQL returned by convertSmqToSql (CTEs, window functions, subqueries and further joins are allowed).
   - Use only physical tables and columns that appear in compiled SQL. Never guess other tables.
   - Dialect: ${dialectName}. Produce one read-only statement.
${instructions ?? ''}

# RULES

- Discover first, then compile SMQs, then execute.
- At least one convertSmqToSql call must succeed before execute.
- Fix compile errors reported by the runtime and try again.
- Prefer the smallest correct query that answers the question.${includeSummary ? '' : '\n- No summary is needed.'}`;
}

/** Answer a question through the semantic layer using a constrained Think–Act loop. */
export const semanticAnalysis: AnalysisStrategy = async (
  query,
  config,
  { context, engine, llm, emit, semantic }
) => {
  if (!semantic) throw new Error('The semantic strategy requires a semantic layer. Call semantic() first.');

  semantic.validateAgainstSchema(context.schema);

  const dialect = semantic.dialect ?? inferDialect(engine.language.name);
  const maxSteps = Math.max((config.strategy as { maxSteps?: number })?.maxSteps ?? DEFAULT_MAX_STEPS, 1);
  const system = systemPrompt(engine.language.name, engine.language.instructions, config.includeSummary !== false);
  const transcript: string[] = [];
  const allowedTables = new Set<string>();

  for (let step = 0; step < maxSteps; step += 1) {
    const history = transcript.length ? `\n\n# HISTORY\n\n${transcript.join('\n\n')}` : '';
    const final =
      step === maxSteps - 1
        ? '\n\n# FINAL STEP\n\nThis is the last step. You MUST respond with the execute tool call now.'
        : '';

    emit(new AnalysisEvent(AnalysisEventType.REASON_START, { step }));

    let text: string;
    let call: ToolCall;
    try {
      const response = await generateText({
        model: languageModel(llm),
        maxRetries: llm.maxRetries ?? 3,
        prompt: `${system}\n\nUser Question: ${query}${history}${final}`,
      });
      llm.onQueryUsage?.(response.usage);
      text = response.text.trim();

      try {
        call = parseToolCall(text);
      } catch (error) {
        emit(new AnalysisEvent(AnalysisEventType.REASON_END, { step, text, error: serializeError(error) }));
        transcript.push(`Assistant:\n${text}`, `Runtime error:\n${(error as Error).message}`);
        continue;
      }
    } catch (error) {
      emit(new AnalysisEvent(AnalysisEventType.REASON_END, { step, error: serializeError(error) }));
      throw error;
    }

    emit(new AnalysisEvent(AnalysisEventType.REASON_END, { step, action: call.tool, text }));
    transcript.push(`Assistant:\n${JSON.stringify(call)}`);

    if (call.tool === 'getModelDataElements') {
      try {
        const models = Array.isArray(call.args.models) ? (call.args.models as string[]) : undefined;
        const elements = semantic.elements(models);
        const names = new Set(elements.map((e) => e.model));
        const joins = semantic.joins.filter((j) => names.has(j.from) || names.has(j.to));
        transcript.push(`Runtime:\n${JSON.stringify({ elements, joins })}`);
      } catch (error) {
        transcript.push(`Runtime error:\n${(error as Error).message}`);
      }
      continue;
    }

    if (call.tool === 'convertSmqToSql') {
      let compiled: ReturnType<typeof compileSMQ>;
      try {
        compiled = compileSMQ(semantic, call.args as SMQ, dialect);
      } catch (error) {
        transcript.push(`Runtime error:\n${error instanceof Error ? error.message : String(error)}`);
        continue;
      }

      emit(new AnalysisEvent(AnalysisEventType.QUERY_START, { dsl: compiled.sql }));
      try {
        const preview = await engine.execute(compiled.sql, { ...config, maxRows: PREVIEW_ROWS });
        emit(new AnalysisEvent(AnalysisEventType.QUERY_END, preview));
        for (const table of compiled.tables) allowedTables.add(normalizeTable(table));
        transcript.push(
          `Runtime:\n${JSON.stringify({ sql: compiled.sql, columns: compiled.columns, preview: preview.data })}`
        );
      } catch (error) {
        emit(new AnalysisEvent(AnalysisEventType.QUERY_END, { error: serializeError(error) }));
        transcript.push(
          `Runtime error:\nCompiled SQL failed to execute:\n${compiled.sql}\n${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
      continue;
    }

    // execute: terminal action
    const sql = typeof call.args.sql === 'string' ? call.args.sql.trim() : '';
    if (!sql) {
      transcript.push('Runtime error:\nexecute requires args.sql.');
      continue;
    }
    if (allowedTables.size === 0) {
      transcript.push('Runtime error:\nCall convertSmqToSql successfully at least once before execute.');
      continue;
    }
    const disallowed = findDisallowedTables(sql, allowedTables);
    if (disallowed.length) {
      transcript.push(
        `Runtime error:\nThe final SQL references tables not introduced by compiled SMQs: ${disallowed.join(', ')}. Use only compiled tables.`
      );
      continue;
    }

    emit(new AnalysisEvent(AnalysisEventType.QUERY_START, { dsl: sql }));

    let result: ExecutionResult;
    try {
      result = await engine.execute(sql, config);
    } catch (error) {
      emit(new AnalysisEvent(AnalysisEventType.QUERY_END, { error: serializeError(error) }));
      throw new Error(
        `Semantic final SQL failed: ${error instanceof Error ? error.message : String(error)}\nSQL:\n${sql}`
      );
    }

    emit(new AnalysisEvent(AnalysisEventType.QUERY_END, result));

    let summary = '';
    if (config.includeSummary !== false) {
      emit(new AnalysisEvent(AnalysisEventType.SUMMARIZE_START));
      try {
        summary = await summarizeResult(
          query,
          result.truncatedBy ? { data: result.data, truncated: true, truncatedBy: result.truncatedBy } : result.data,
          llm
        );
      } catch (error) {
        emit(new AnalysisEvent(AnalysisEventType.SUMMARIZE_END, { error: serializeError(error) }));
        throw error;
      }
      emit(new AnalysisEvent(AnalysisEventType.SUMMARIZE_END, { text: summary }));
    }

    return { query, ...result, sql, text: summary };
  }

  throw new Error(`Semantic strategy reached the step limit (${maxSteps}) without executing a final SQL`);
};
