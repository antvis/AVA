import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DuckDBEngine } from '../../../src/duckdb/engine';
import { JavaScriptEngine } from '../../../src/interpreter/javascript/engine';

import type { LLMConfig } from '../../../src/types';

const llm: LLMConfig = {
  model: 'test-model',
  apiKey: 'test-only',
  baseURL: 'https://example.invalid/v1',
  maxRetries: 0,
};

describe.each([
  { name: 'DuckDB', Engine: DuckDBEngine },
  { name: 'JavaScript', Engine: JavaScriptEngine },
])('text JSON ingestion ($name)', ({ Engine }) => {
  let engine: DuckDBEngine | JavaScriptEngine;
  let responseText: string;
  let fetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    engine = new Engine(llm);
    fetch = vi.fn().mockImplementation(async () => {
      return new Response(
        JSON.stringify({
          id: 'test',
          created: 0,
          model: 'test-model',
          choices: [{ index: 0, message: { role: 'assistant', content: responseText }, finish_reason: 'stop' }],
          usage: { prompt_tokens: 3, completion_tokens: 2, total_tokens: 5 },
        }),
        { headers: { 'content-type': 'application/json' } }
      );
    });
    vi.stubGlobal('fetch', fetch);
  });

  afterEach(async () => {
    await engine.dispose();
    vi.unstubAllGlobals();
  });

  it.each(['raw', 'json', 'unlabelled', 'CRLF', 'JSON'])('preserves nested values in a %s response', async (format) => {
    const rows = [
      {
        name: 'Alice ] [ "quoted" ```json',
        values: [1.5, 2.5, null],
        details: { city: '杭州', flags: [true, false] },
        missing: null,
      },
    ];
    const json = JSON.stringify(rows, null, 2);
    if (format === 'raw') responseText = `  ${json}  `;
    else if (format === 'CRLF') responseText = `\`\`\`json\r\n${json}\r\n\`\`\``;
    else responseText = `\`\`\`${format === 'unlabelled' ? '' : format}\n${json}\n\`\`\``;
    await engine.load({ type: 'text', options: { text: 'Beijing 100' } });
    const request = JSON.parse(fetch.mock.calls[0][1].body);
    expect(request).not.toHaveProperty('response_format');
    expect(JSON.stringify(request.messages)).toContain('Beijing 100');
    const data = engine instanceof DuckDBEngine ? (await engine.execute('SELECT * FROM data')).data : engine.getData();
    expect(data).toEqual(rows);
  });

  it('accepts an empty rows array', async () => {
    responseText = '[]';
    await engine.load({ type: 'text', options: { text: 'No records' } });
    const data = engine instanceof DuckDBEngine ? (await engine.execute('SELECT * FROM data')).data : engine.getData();
    expect(data).toEqual([]);
  });

  it.each([{}, null, { rows: [] }, [1], [null], [[]]])('rejects invalid extracted records %j', async (output) => {
    responseText = JSON.stringify(output);
    await expect(engine.load({ type: 'text', options: { text: 'Invalid records' } })).rejects.toThrow();
    await expect(engine.schema()).rejects.toThrow('No data loaded');
  });

  it.each([
    '[{"values":[1,2]}',
    '```json\n[{"values":[1,2]}]',
    'Here are the records:\n[{"values":[1,2]}]',
    '```json\n[]\n```\nMore explanation',
  ])('rejects malformed or partially wrapped JSON %s', async (text) => {
    responseText = text;
    await expect(engine.load({ type: 'text', options: { text: 'Invalid JSON' } })).rejects.toThrow(SyntaxError);
    await expect(engine.schema()).rejects.toThrow('No data loaded');
  });

  it('propagates model errors without retrying extraction', async () => {
    fetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: { message: 'Model unavailable', type: 'invalid_request_error' } }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      })
    );
    await expect(engine.load({ type: 'text', options: { text: 'Beijing 100' } })).rejects.toThrow('Model unavailable');
    expect(fetch).toHaveBeenCalledTimes(1);
    await expect(engine.schema()).rejects.toThrow('No data loaded');
  });
});
