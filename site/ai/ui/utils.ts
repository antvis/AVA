import type { HighlighterCore } from 'shiki';
import { createHighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import javascript from 'shiki/langs/javascript.mjs';
import sql from 'shiki/langs/sql.mjs';
import json from 'shiki/langs/json.mjs';
import githubLight from 'shiki/themes/github-light.mjs';
import type { Message } from './types';
import type { AIUIMessage } from '../core/session';

/* ------------------------------------------------------------------ */
/* Message updates — preserve text and tool order                       */
/* ------------------------------------------------------------------ */

// This is a render projection; useChat owns the messages and their tool states.
export function toDisplayMessage(source: AIUIMessage, datasetName: string): Message {
  const message: Message = {
    role: source.role === 'user' ? 'user' : 'assistant',
    text: '',
    parts: source.parts,
    ...(source.role === 'user' ? { attachments: [datasetName] } : {}),
  };
  for (const part of source.parts) {
    if (part.type === 'text') {
      message.text += part.text;
    } else if (part.type === 'tool-analyze' && part.state === 'output-available') {
      message.artifact = {
        id: `${source.id}:${part.toolCallId}`,
        title: 'query.js',
        description: part.output.query,
        code: part.output.sql,
        data: part.output.data,
      };
    } else if (part.type === 'tool-visualize' && part.state === 'output-available') {
      const { result, syntax } = part.output;
      message.artifact = {
        id: `${source.id}:${part.toolCallId}`,
        title: 'visualization.html',
        description: result.query,
        code: result.sql,
        data: result.data,
        syntax,
      };
    }
  }
  if (message.artifact) {
    const { code, syntax } = message.artifact;
    const files = {
      ...(code ? { 'query.js': code } : {}),
      ...(syntax ? { 'visualization.vis': syntax } : {}),
    };

    message.diffs = Object.entries(files).map(([file, content]) => ({ file, add: content.split('\n').length }));
    message.diffLines = Object.fromEntries(
      Object.entries(files).map(([file, content]) => [
        file,
        content.split('\n').map((text) => ({ text, tone: 'add' as const })),
      ])
    );
  }
  return message;
}

/* ------------------------------------------------------------------ */
/* Result tables — normalize rows and format values                     */
/* ------------------------------------------------------------------ */

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isTable(value: unknown): value is Record<string, unknown>[] {
  return (
    Array.isArray(value) &&
    value.every(
      (row) =>
        isRecord(row) &&
        Object.values(row).every((cell) => cell === null || ['string', 'number', 'boolean'].includes(typeof cell))
    )
  );
}

/** Only tabular results become tables; preserve other structures as JSON. */
export function resultTables(data: unknown): { name?: string; rows: Record<string, unknown>[] }[] | null {
  if (isTable(data)) return [{ rows: data }];

  // The JavaScript engine wraps non-array results in a single value row.
  let candidate = data;
  if (Array.isArray(data) && data.length === 1 && isRecord(data[0])) {
    candidate = Object.keys(data[0]).length === 1 && 'value' in data[0] ? data[0].value : data[0];
  }
  if (isTable(candidate)) return [{ rows: candidate }];
  if (Array.isArray(candidate) && candidate.every(isTable)) {
    return candidate.map((rows) => ({ rows }));
  }
  if (isRecord(candidate)) {
    const entries = Object.entries(candidate);
    if (entries.length && entries.every(([, rows]) => isTable(rows))) {
      return entries.map(([name, rows]) => ({ name, rows: rows as Record<string, unknown>[] }));
    }
  }
  return null;
}

export function resultColumns(rows: Record<string, unknown>[]): string[] {
  return [...new Set(rows.flatMap((row) => Object.keys(row)))];
}

export function formatResultValue(value: unknown): string {
  if (value == null) return '—';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}

/* ------------------------------------------------------------------ */
/* Composer — detect @ sources and / commands                           */
/* ------------------------------------------------------------------ */

/** the last @word or /word being typed, if any */
export function parseToken(draft: string): { kind: 'at' | 'slash'; query: string; start: number } | null {
  const match = /(^|\s)([@/])([\w-]*)$/.exec(draft);
  if (!match) return null;
  return {
    kind: match[2] === '@' ? 'at' : 'slash',
    query: match[3].toLowerCase(),
    start: match.index + match[1].length,
  };
}

/* ------------------------------------------------------------------ */
/* Code highlighting — lazy initialization, shared across previews      */
/* ------------------------------------------------------------------ */

let highlighter: Promise<HighlighterCore> | undefined;

export async function highlightCode(code: string, language: 'javascript' | 'sql' | 'json') {
  highlighter ??= createHighlighterCore({
    themes: [githubLight],
    langs: [javascript, sql, json],
    engine: createJavaScriptRegexEngine(),
  });
  return (await highlighter).codeToTokens(code, { lang: language, theme: 'github-light' }).tokens;
}
