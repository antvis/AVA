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
  constructor(message: string, readonly code?: number, readonly cause?: unknown, readonly status?: number) {
    super(`Tencent Docs: ${message}`);
    this.name = 'TencentDocsError';
  }
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function apiError(code: number, message?: string, cause?: unknown, status?: number): TencentDocsError {
  const hint = ERROR_MESSAGES[code];
  return new TencentDocsError(
    [`API request failed (code ${code}).`, message, hint].filter(Boolean).join(' '),
    code,
    cause,
    status
  );
}

function upstreamMessage(value: Record<string, unknown>): string | undefined {
  const error = isObject(value.error) ? value.error : value;
  const message = error.message ?? error.msg ?? (typeof value.error === 'string' ? value.error : undefined);
  return typeof message === 'string' ? message : undefined;
}

/** Preserve upstream error properties/cause chains, redacting only the configured credential. */
function redactToken(value: unknown, token: string, seen = new Map<object, unknown>()): unknown {
  if (typeof value === 'string') return token ? value.split(token).join('[REDACTED]') : value;
  if (value === null || typeof value !== 'object') return value;
  if (seen.has(value)) return seen.get(value);
  const copy = Array.isArray(value) ? [] : Object.create(Object.getPrototypeOf(value));
  seen.set(value, copy);
  const descriptors = Object.getOwnPropertyDescriptors(value);
  // V8 exposes stack through a lazy accessor with native Error state. Materialize
  // it on the original, then copy/redact the string rather than copying the getter.
  if (value instanceof Error) {
    for (const key of ['name', 'message', 'stack'] as const) {
      if (typeof value[key] === 'string') {
        descriptors[key] = { value: value[key], writable: true, configurable: true, enumerable: false };
      }
    }
  }
  for (const descriptor of Object.values(descriptors)) {
    if ('value' in descriptor) descriptor.value = redactToken(descriptor.value, token, seen);
  }
  Object.defineProperties(copy, descriptors);
  return copy;
}

/** Keep HTTP diagnostics bounded independently of successful MCP response limits. */
async function httpErrorBody(response: Response): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return '';
  const decoder = new TextDecoder();
  let text = '';
  let remaining = 8192;
  try {
    while (remaining > 0) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = value.subarray(0, remaining);
      text += decoder.decode(chunk, { stream: true });
      remaining -= chunk.byteLength;
    }
    return text + decoder.decode() + (remaining === 0 ? ' [diagnostic body truncated at 8 KiB]' : '');
  } finally {
    await reader.cancel().catch(() => undefined);
  }
}

function upstreamCode(value: Record<string, unknown>): unknown {
  return value.code ?? value.ret ?? (isObject(value.error) ? value.error.code : undefined);
}

function checkError(value: Record<string, unknown>): void {
  const code = upstreamCode(value);
  if (typeof code === 'number' && code !== 0) throw apiError(code, upstreamMessage(value), value);
  if (value.error) throw new TencentDocsError(upstreamMessage(value) ?? 'Tool returned an error.', undefined, value);
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
  if (isObject(body)) {
    checkError(body);
    if (isObject(body.data)) checkError(body.data);
  }
  if (result.isError) {
    const text = Array.isArray(result.content)
      ? result.content
          .filter((item) => isObject(item) && item.type === 'text' && typeof item.text === 'string')
          .map((item) => item.text)
          .join('\n')
      : '';
    throw new TencentDocsError(
      (isObject(body) ? upstreamMessage(body) : undefined) || text || 'MCP tool reported failure.',
      undefined,
      result
    );
  }
  if (!isObject(body)) throw new TencentDocsError('Expected a JSON object from the MCP tool.');
  if (isObject(body.data)) {
    return body.data;
  }
  return body;
}

/** Only the two read tools are exposed; no model can select a write operation. */
export type TencentReadTool = 'smartsheet.list_fields' | 'smartsheet.list_records';

export class TencentDocsClient {
  private readonly client = new Client({ name: 'ava-tencent-docs', version: '1.0.0' });
  private token = '';

  constructor(private readonly signal: AbortSignal, private readonly maxRetries: number) {}

  async connect(token: string): Promise<void> {
    this.token = token;
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
          } catch (error) {
            if (signal.aborted)
              throw new TencentDocsError('Load deadline exceeded.', undefined, redactToken(error, token));
            if (attempt >= this.maxRetries) throw redactToken(error, token);
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
          if ([429, 502, 503, 504].includes(status) && attempt < this.maxRetries && waitMs <= 30000) {
            await response.body?.cancel();
            await delay(waitMs, undefined, { signal });
            continue;
          }
          const body = await httpErrorBody(response);
          let payload: unknown = body;
          try {
            payload = JSON.parse(body);
          } catch {
            // Non-JSON HTTP diagnostics are useful too (for example gateway errors).
          }
          const requestId = response.headers.get('x-request-id') ?? response.headers.get('x-log-id');
          const diagnostic = `HTTP request failed (status ${status} ${response.statusText}).${
            requestId ? ` Request ID: ${requestId}.` : ''
          }${body ? ` ${body}` : ''}`;
          const upstream = isObject(payload) ? upstreamCode(payload) : undefined;
          const code =
            typeof upstream === 'number' && upstream !== 0
              ? upstream
              : status === 401
              ? 400006
              : status === 403
              ? 400005
              : status === 429
              ? 400007
              : status;
          throw redactToken(apiError(code, diagnostic, { body: payload, requestId }, status), token);
        }
      },
    });
    try {
      await this.client.connect(transport, { signal: this.signal });
    } catch (error) {
      const upstream = redactToken(error, token);
      if (this.signal.aborted) throw new TencentDocsError('Load deadline exceeded.', undefined, upstream);
      throw upstream;
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
        const upstream = redactToken(error, this.token);
        if (this.signal.aborted) throw new TencentDocsError('Load deadline exceeded.', undefined, upstream);
        const code = error instanceof TencentDocsError ? error.code : isObject(error) ? error.code : undefined;
        // Daily quota exhaustion is not retried. Only the documented transient service error is.
        if (code === 400010 && attempt < this.maxRetries) {
          await delay(500 * 2 ** attempt, undefined, { signal: this.signal });
          continue;
        }
        throw upstream;
      }
    }
  }

  async close(): Promise<void> {
    await this.client.close();
  }
}
