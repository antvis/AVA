import { NoObjectGeneratedError } from 'ai';
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

  it('requests JSON mode and preserves nested values and brackets inside strings', async () => {
    const rows = [
      {
        name: 'Alice ] [ "quoted"',
        values: [1.5, 2.5, null],
        details: { city: '杭州', flags: [true, false] },
        missing: null,
      },
    ];
    responseText = JSON.stringify({ rows });
    await engine.load({ type: 'text', options: { text: 'Beijing 100' } });
    const request = JSON.parse(fetch.mock.calls[0][1].body);
    expect(request.response_format).toEqual({ type: 'json_object' });
    expect(JSON.stringify(request.messages)).toContain('Beijing 100');
    const data = engine instanceof DuckDBEngine ? (await engine.execute('SELECT * FROM data')).data : engine.getData();
    expect(data).toEqual(rows);
  });

  it('accepts an empty rows array', async () => {
    responseText = '{"rows":[]}';
    await engine.load({ type: 'text', options: { text: 'No records' } });
    const data = engine instanceof DuckDBEngine ? (await engine.execute('SELECT * FROM data')).data : engine.getData();
    expect(data).toEqual([]);
  });

  it.each([{}, { rows: null }, { rows: {} }, { rows: [1] }, { rows: [null] }, { rows: [[]] }])(
    'rejects invalid extracted records %j',
    async (output) => {
      responseText = JSON.stringify(output);
      await expect(engine.load({ type: 'text', options: { text: 'Invalid records' } })).rejects.toThrow();
      await expect(engine.schema()).rejects.toThrow('No data loaded');
    }
  );

  it('propagates SDK errors for malformed JSON without extracting a partial array', async () => {
    responseText = '{"rows":[{"values":[1,2]}]';
    await expect(engine.load({ type: 'text', options: { text: 'Invalid JSON' } })).rejects.toThrow(
      NoObjectGeneratedError
    );
    await expect(engine.schema()).rejects.toThrow('No data loaded');
  });

  it('reports unsupported JSON mode without falling back to plain text', async () => {
    fetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: { message: 'JSON mode unsupported', type: 'invalid_request_error' } }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      })
    );
    await expect(engine.load({ type: 'text', options: { text: 'Beijing 100' } })).rejects.toThrow(
      'JSON mode unsupported'
    );
    expect(fetch).toHaveBeenCalledTimes(1);
    await expect(engine.schema()).rejects.toThrow('No data loaded');
  });
});
