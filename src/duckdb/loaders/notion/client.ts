import { setTimeout as delay } from 'node:timers/promises';

/** Official Notion REST API endpoint. */
export const NOTION_API_BASE = 'https://api.notion.com';
export const NOTION_DEFAULT_VERSION = '2022-06-28';

const MAX_RESPONSE_BYTES = 16 * 1024 * 1024;

const ERROR_HINTS: Record<number, string> = {
  400: 'Invalid request; verify the database id and query parameters.',
  401: 'Invalid, expired, or missing integration token.',
  403: 'The integration lacks access to this database, or the token lacks the required capability.',
  404: 'The database was not found or is not shared with this integration.',
  409: 'The database id conflicts with another resource type; use a database, not a page.',
  429: 'Notion API rate limit exceeded; retry later.',
};

/** Error carrying Notion upstream status/code and a redacted cause chain. */
export class NotionError extends Error {
  constructor(message: string, readonly status?: number, readonly code?: string, readonly cause?: unknown) {
    super(`Notion: ${message}`);
    this.name = 'NotionError';
  }
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function apiError(status: number, message: string, cause?: unknown, code?: string): NotionError {
  const hint = ERROR_HINTS[status];
  return new NotionError([message, hint].filter(Boolean).join(' '), status, code, cause);
}

/** Redact the configured token from strings, including error stacks and causes. */
export function redactToken(value: unknown, token: string, seen = new Map<object, unknown>()): unknown {
  if (typeof value === 'string') return token ? value.split(token).join('[REDACTED]') : value;
  if (value === null || typeof value !== 'object') return value;
  if (seen.has(value)) return seen.get(value);
  const copy = Array.isArray(value) ? [] : Object.create(Object.getPrototypeOf(value));
  seen.set(value, copy);
  const descriptors = Object.getOwnPropertyDescriptors(value);
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

/** Keep HTTP diagnostics bounded. */
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

function upstreamCode(value: Record<string, unknown>): string | undefined {
  const code = isObject(value.code) ? value.code.value : value.code;
  return typeof code === 'string' ? code : undefined;
}

/**
 * Notion Rest client: read-only operations against the official REST API.
 * Only database retrieve and database query are exposed; no page write or
 * create/update/delete operation exists on this connector, so a model routed
 * through AVA can never modify the source workspace.
 */
export class NotionClient {
  private readonly token: string;
  private readonly version: string;

  constructor(
    private readonly signal: AbortSignal,
    token: string,
    version: string,
    private readonly maxRetries: number
  ) {
    this.token = token;
    this.version = version;
  }

  /** Retrieve a database's schema: GET /v1/databases/:id */
  async retrieveDatabase(databaseId: string): Promise<Record<string, unknown>> {
    return this.request('GET', `/v1/databases/${encodeURIComponent(databaseId)}`, undefined);
  }

  /** Query a database's pages: POST /v1/databases/:id/query (read-only, never writes). */
  async queryDatabase(
    databaseId: string,
    body: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    return this.request('POST', `/v1/databases/${encodeURIComponent(databaseId)}/query`, body);
  }

  private async request(
    method: 'GET' | 'POST',
    path: string,
    body?: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    for (let attempt = 0; ; attempt++) {
      let response: Response;
      try {
        response = await fetch(`${NOTION_API_BASE}${path}`, {
          method,
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Notion-Version': this.version,
            ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
          },
          ...(body === undefined ? {} : { body: JSON.stringify(body) }),
          signal: this.signal,
        });
      } catch (error) {
        if (this.signal.aborted) throw new NotionError('Load deadline exceeded.', undefined, undefined, error);
        if (attempt >= this.maxRetries) throw redactToken(error, this.token);
        await delay(500 * 2 ** attempt, undefined, { signal: this.signal });
        continue;
      }

      if (response.ok) {
        if (!response.body) return {};
        let bytes = 0;
        const stream = response.body.pipeThrough(
          new TransformStream<Uint8Array, Uint8Array>({
            transform(chunk, controller) {
              bytes += chunk.byteLength;
              if (bytes > MAX_RESPONSE_BYTES) throw new NotionError('Response exceeds the 16 MiB read limit.');
              controller.enqueue(chunk);
            },
          })
        );
        const streamed = new Response(stream, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        });
        const payload = (await streamed.json()) as unknown;
        if (!isObject(payload)) throw new NotionError('Invalid JSON response from Notion.');
        return payload;
      }

      const status = response.status;
      const retryAfter = response.headers.get('Retry-After');
      const waitMs = retryAfter ? Math.max(0, /^\d+$/.test(retryAfter) ? Number(retryAfter) * 1000 : 0) : 500 * 2 ** attempt;
      if ([429, 502, 503, 504].includes(status) && attempt < this.maxRetries && waitMs <= 30000) {
        await response.body?.cancel();
        await delay(waitMs, undefined, { signal: this.signal });
        continue;
      }
      const errorBody = await httpErrorBody(response);
      let payload: unknown = errorBody;
      try {
        payload = JSON.parse(errorBody);
      } catch {
        // Non-JSON HTTP diagnostics are useful too.
      }
      const upstream = isObject(payload) ? upstreamCode(payload) : undefined;
      throw redactToken(
        apiError(status, `HTTP request failed (status ${status} ${response.statusText}).${errorBody ? ` ${errorBody}` : ''}`, { body: payload }, upstream),
        this.token
      );
    }
  }
}