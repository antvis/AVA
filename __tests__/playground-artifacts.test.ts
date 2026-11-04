import { describe, expect, it } from 'vitest';
import {
  artifactForPart,
  resultSegments,
  resultTables,
  splitMessageParts,
  toDisplayMessage,
} from '../site/ai/ui/utils';
import type { AIUIMessage } from '../site/ai/core/session';

describe('Playground result projection', () => {
  it('keeps public progress and failed tools in the process, and moves the final answer outside when finished', () => {
    const parts = [
      { type: 'text', text: 'Checking the data.' },
      {
        type: 'dynamic-tool',
        toolName: 'query',
        toolCallId: 'one',
        state: 'output-error',
        input: {},
        errorText: 'Failed',
      },
      { type: 'text', text: 'Final answer.\n[[result:R1]]' },
    ] as AIUIMessage['parts'];
    expect(splitMessageParts(parts, true)).toEqual({ process: parts, answer: [] });
    expect(splitMessageParts(parts, false)).toEqual({ process: parts.slice(0, 2), answer: parts.slice(2) });
    expect(splitMessageParts(parts.slice(2), false)).toEqual({ process: [], answer: parts.slice(2) });
    const reviewed = [
      ...parts,
      { type: 'step-start' },
      { type: 'text', text: 'Reviewed main-agent answer.' },
    ] as AIUIMessage['parts'];
    expect(splitMessageParts(reviewed, false)).toEqual({ process: reviewed.slice(0, -1), answer: reviewed.slice(-1) });
  });
  it('recognizes result blocks without interpreting code examples, inline prose or partial streamed markers', () => {
    expect(resultSegments('Finding.\n[[result:call-1]]\nNext.')).toEqual([
      { text: 'Finding.\n' },
      { resultId: 'call-1' },
      { text: 'Next.' },
    ]);
    const example = '```text\n[[result:call-1]]\n```\nInline [[result:call-1]] stays text.';
    expect(resultSegments(example)).toEqual([{ text: example }]);
    expect(resultSegments('Finding.\n[[result:call-', true)).toEqual([{ text: 'Finding.\n' }]);
    expect(resultSegments('[[result:__proto__]]')).toEqual([{ resultId: '__proto__' }]);
    expect(resultSegments('[[result:R1]] [[result:R2]]')).toEqual([{ resultId: 'R1' }, { resultId: 'R2' }]);
  });
  it('shows an overall record and dimension arrays as separate tables without changing values', () => {
    const overall = { current: 1832.65, change: -20.58 };
    const channels = [{ channel: 'new', baseline: null, current: 98.08 }];
    expect(resultTables([{ value: { overall, channels } }])).toEqual([
      { name: 'overall', rows: [overall] },
      { name: 'channels', rows: channels },
    ]);
    expect(resultTables([{ value: { nested: { array: [1, 2] } } }])).toBeNull();
    expect(resultTables([{ value: { channel_changes: channels, total_change: -20.58, matches: true } }])).toEqual([
      { name: 'Summary', rows: [{ total_change: -20.58, matches: true }] },
      { name: 'channel_changes', rows: channels },
    ]);
  });
  it('keeps a chart bound to its result when a later drill-down completes', () => {
    const first = { query: 'channel change', sql: 'return channels', data: [{ channel: 'A', change: -2 }] };
    const next = { query: 'category change', sql: 'return categories', data: [{ category: 'B', change: -2 }] };
    const config = { type: 'bar', data: [{ category: 'A', value: -2 }] };
    const message = {
      id: 'answer',
      role: 'assistant',
      parts: [
        {
          type: 'tool-analyze',
          toolCallId: 'one',
          state: 'output-available',
          input: { query: first.query },
          output: { ...first, visualization: { config, chartType: 'bar', html: '<html />' } },
        },
        {
          type: 'tool-analyze',
          toolCallId: 'three',
          state: 'output-available',
          input: { query: next.query },
          output: { ...next, visualization: null, visualizationError: 'Chart request failed' },
        },
        {
          type: 'tool-analyze',
          toolCallId: 'four',
          state: 'output-error',
          input: { query: 'failed' },
          errorText: 'failed',
        },
      ],
    } as AIUIMessage;
    const artifacts = message.parts.map((part) => artifactForPart(part)).filter(Boolean);
    expect(artifacts).toHaveLength(2);
    expect(artifacts.map((artifact) => artifact!.id)).toEqual(['one', 'three']);
    expect(artifacts[0]).toMatchObject({ data: first.data, code: first.sql, config });
    expect(artifacts[1]).toMatchObject({ data: next.data, code: next.sql, error: 'Chart request failed' });
    expect(toDisplayMessage(message, 'test.json').parts).toBe(message.parts);
  });
});
