import { setTimeout as delay } from 'node:timers/promises';

import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';

const ENDPOINT = 'https://docs.qq.com/openapi/mcp';
const ERROR_MESSAGES: Record<number, string> = {
  400001: 'Invalid API parameters; verify fileId and sheetId.',
  400005: 'Permission denied; grant the token owner access to this SmartSheet.',
  400006: 'Authentication failed; check TENCENT_DOCS_TOKEN.',
  400007: 'API quota exceeded; wait or check your Tencent Docs membership quota.',
  400010: 'Tencent Docs service is temporarily unavailable.',
  400012: 'Authorization expired; obtain a new Tencent Docs MCP token.',
};

export class TencentDocsError extends Error {
  constructor(message: string, readonly code?: number) {
    super(`Tencent Docs: ${message}`);
    this.name = 'TencentDocsError';
  }
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function apiError(code: number): TencentDocsError {
  // Never echo upstream messages: they can contain credentials or private cell values.
  return new TencentDocsError(ERROR_MESSAGES[code] ?? `API request failed (code ${code}).`, code);
}

function checkError(value: Record<string, unknown>): void {
  const code = value.code ?? value.ret ?? (isObject(value.error) ? value.error.code : undefined);
  if (typeof code === 'number' && code !== 0) throw apiError(code);
  if (value.error) throw new TencentDocsError('Tool returned an error.');
}

/** Prefer structuredContent; require exactly one JSON text block otherwise. */
export function decodeToolResult(result: unknown): Record<string, unknown> {
  if (!isObject(result)) throw new TencentDocsError('Invalid MCP tool response.');
  let body: unknown = result.structuredContent;
  if (body === undefined) {
    const text = Array.isArray(result.content)
      ? result.content.filter((item) => isObject(item) && item.type === 'text')
      : [];
    if (text.length === 1 && isObject(text[0]) && typeof text[0].text === 'string') {
      try {
        body = JSON.parse(text[0].text);
      } catch {
        // Deliberately do not include the untrusted body in the error.
      }
    }
  }
  if (isObject(body)) checkError(body);
  if (result.isError) throw new TencentDocsError('MCP tool reported failure.');
  if (!isObject(body)) throw new TencentDocsError('Expected a JSON object from the MCP tool.');
  if (isObject(body.data)) {
    checkError(body.data);
    return body.data;
  }
  return body;
}

/** Only the two read tools are exposed; no model can select a write operation. */
export type TencentReadTool = 'smartsheet.list_fields' | 'smartsheet.list_records';

export class TencentDocsClient {
  private readonly client = new Client({ name: 'ava-tencent-docs', version: '1.0.0' });

  constructor(private readonly signal: AbortSignal, private readonly maxRetries: number) {}

  async connect(token: string): Promise<void> {
    const transport = new StreamableHTTPClientTransport(new URL(ENDPOINT), {
      requestInit: { headers: { Authorization: token } },
      fetch: async (input, init) => {
        const url = new URL(String(input));
        if (url.origin !== 'https://docs.qq.com' || url.pathname !== '/openapi/mcp') {
          throw new TencentDocsError('Refusing an unexpected MCP request destination.');
        }
        // Do not forward the Authorization value to a redirect target.
        const signal = init?.signal ? AbortSignal.any([this.signal, init.signal]) : this.signal;
        for (let attempt = 0; ; attempt++) {
          let response: Response;
          try {
            response = await fetch(input, { ...init, signal, redirect: 'error' });
          } catch {
            if (signal.aborted) throw new TencentDocsError('Load deadline exceeded.');
            if (attempt >= this.maxRetries) throw new TencentDocsError('Network request failed.');
            await delay(500 * 2 ** attempt, undefined, { signal });
            continue;
          }
          if (response.ok) {
            if (!response.body) return response;
            let bytes = 0;
            const body = response.body.pipeThrough(
              new TransformStream<Uint8Array, Uint8Array>({
                transform(chunk, controller) {
                  bytes += chunk.byteLength;
                  if (bytes > 16 * 1024 * 1024)
                    throw new TencentDocsError('MCP response exceeds the 16 MiB read limit.');
                  controller.enqueue(chunk);
                },
              })
            );
            return new Response(body, {
              status: response.status,
              statusText: response.statusText,
              headers: response.headers,
            });
          }
          const status = response.status;
          const retryAfter = response.headers.get('Retry-After');
          const waitMs = retryAfter
            ? Math.max(0, /^\d+$/.test(retryAfter) ? Number(retryAfter) * 1000 : Date.parse(retryAfter) - Date.now())
            : 500 * 2 ** attempt;
          await response.body?.cancel();
          if ([429, 502, 503, 504].includes(status) && attempt < this.maxRetries && waitMs <= 30000) {
            await delay(waitMs, undefined, { signal });
            continue;
          }
          if (status === 401) throw apiError(400006);
          if (status === 403) throw apiError(400005);
          if (status === 429) throw apiError(400007);
          throw new TencentDocsError(`HTTP request failed (status ${status}).`, status);
        }
      },
    });
    try {
      await this.client.connect(transport, { signal: this.signal });
    } catch (error) {
      if (error instanceof TencentDocsError) throw error;
      throw new TencentDocsError(this.signal.aborted ? 'Load deadline exceeded.' : 'MCP connection failed.');
    }
  }

  async call(name: TencentReadTool, args: Record<string, unknown>): Promise<Record<string, unknown>> {
    if (name !== 'smartsheet.list_fields' && name !== 'smartsheet.list_records') {
      throw new TencentDocsError('Only SmartSheet field and record read tools are allowed.');
    }
    for (let attempt = 0; ; attempt++) {
      try {
        const result = await this.client.callTool({ name, arguments: args }, { signal: this.signal });
        return decodeToolResult(result);
      } catch (error) {
        if (this.signal.aborted) throw new TencentDocsError('Load deadline exceeded.');
        const code = error instanceof TencentDocsError ? error.code : isObject(error) ? error.code : undefined;
        // Daily quota exhaustion is not retried. Only the documented transient service error is.
        if (code === 400010 && attempt < this.maxRetries) {
          await delay(500 * 2 ** attempt, undefined, { signal: this.signal });
          continue;
        }
        if (error instanceof TencentDocsError) throw error;
        if (typeof code === 'number') throw apiError(code);
        throw new TencentDocsError('MCP read request failed.');
      }
    }
  }

  async close(): Promise<void> {
    await this.client.close();
  }
}
