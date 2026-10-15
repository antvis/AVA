import type { HighlighterCore } from 'shiki';
import { createHighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import javascript from 'shiki/langs/javascript.mjs';
import sql from 'shiki/langs/sql.mjs';
import githubLight from 'shiki/themes/github-light.mjs';
import type { Message } from './types';
import type { PlaygroundUIMessage } from '../core/session';

/* ------------------------------------------------------------------ */
/* Message updates — preserve text and tool order                       */
/* ------------------------------------------------------------------ */

// This is a render projection; useChat owns the messages and their tool states.
export function toDisplayMessage(source: PlaygroundUIMessage, datasetName: string): Message {
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

/** JavaScript queries can return records, nested values, or scalar arrays. */
export function resultRows(data: unknown[]): Record<string, unknown>[] {
  return data.map((row) =>
    row !== null && typeof row === 'object' && !Array.isArray(row) ? (row as Record<string, unknown>) : { value: row }
  );
}

/** Split a structured query result into summary fields and named tables. */
export function resultTables(data: unknown[]): { name?: string; rows: Record<string, unknown>[] }[] {
  let rows = resultRows(data);
  if (rows.length !== 1) return [{ rows }];
  const wrapped = rows[0];
  if (Object.keys(wrapped).length === 1 && wrapped.value !== null && typeof wrapped.value === 'object') {
    rows = resultRows(Array.isArray(wrapped.value) ? wrapped.value : [wrapped.value]);
    if (rows.length !== 1) return [{ rows }];
  }
  const entries = Object.entries(rows[0]);
  const arrays = entries.filter(([, value]) => Array.isArray(value));
  if (!arrays.length) return [{ rows }];
  const summary = Object.fromEntries(entries.filter(([, value]) => !Array.isArray(value)));
  return [
    ...(Object.keys(summary).length ? [{ name: 'Summary', rows: [summary] }] : []),
    ...arrays.map(([name, value]) => ({ name, rows: resultRows(value as unknown[]) })),
  ];
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

export async function highlightCode(code: string, language: 'javascript' | 'sql') {
  highlighter ??= createHighlighterCore({
    themes: [githubLight],
    langs: [javascript, sql],
    engine: createJavaScriptRegexEngine(),
  });
  return (await highlighter).codeToTokens(code, { lang: language, theme: 'github-light' }).tokens;
}
