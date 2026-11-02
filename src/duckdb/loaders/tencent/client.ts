import { setTimeout as delay } from 'node:timers/promises';

export class TencentDocsError extends Error {
  constructor(message: string, readonly code?: number, readonly cause?: unknown, readonly status?: number) {
    super(`Tencent Docs: ${message}`);
    this.name = 'TencentDocsError';
  }
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export interface TencentCredentials {
  clientId: string;
  openId: string;
  accessToken: string;
}

function redactCredentials(value: unknown, secrets: string[], seen = new Map<object, unknown>()): unknown {
  if (typeof value === 'string')
    return secrets.reduce((text, secret) => (secret ? text.split(secret).join('[REDACTED]') : text), value);
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
    if ('value' in descriptor) descriptor.value = redactCredentials(descriptor.value, secrets, seen);
  }
  Object.defineProperties(copy, descriptors);
  return copy;
}

/** Drop a cut-off credential prefix, even if its remaining bytes never arrive.
 * KMP bounds the work to the diagnostic tail and credential prefixes, rather
 * than reading ahead or retaining an unbounded secret-sized response buffer.
 * Repeat after removal so overlapping credentials cannot expose a new prefix.
 * An ambiguous benign suffix may also be omitted: diagnostics fail closed.
 */
function withoutCredentialSuffix(text: string, secrets: string[]): string {
  for (;;) {
    let longest = 0;
    for (const secret of secrets) {
      const pattern = secret.slice(0, text.length);
      if (!pattern) continue;
      const prefix = new Uint32Array(pattern.length);
      for (let i = 1, matched = 0; i < pattern.length; i++) {
        while (matched && pattern[i] !== pattern[matched]) matched = prefix[matched - 1];
        if (pattern[i] === pattern[matched]) matched++;
        prefix[i] = matched;
      }
      let matched = 0;
      for (let i = Math.max(0, text.length - pattern.length); i < text.length; i++) {
        while (matched && (matched === pattern.length || text[i] !== pattern[matched])) matched = prefix[matched - 1];
        if (text[i] === pattern[matched]) matched++;
      }
      longest = Math.max(longest, matched);
    }
    if (!longest) return text;
    text = text.slice(0, text.length - longest);
  }
}

/** Sanitize before output truncation; also protect an already-bounded HTTP read. */
function diagnosticBody(text: string, secrets: string[], readTruncated: boolean): string {
  const input = readTruncated ? withoutCredentialSuffix(text, secrets) : text;
  const safe = redactCredentials(input, secrets) as string;
  const bytes = Buffer.from(safe, 'utf8');
  const outputTruncated = bytes.byteLength > 8192;
  // A streaming decode intentionally omits an incomplete final UTF-8 character.
  const output = outputTruncated ? new TextDecoder().decode(bytes.subarray(0, 8192), { stream: true }) : safe;
  const bounded = outputTruncated ? withoutCredentialSuffix(output, secrets) : output;
  return bounded + (readTruncated || outputTruncated ? ' [diagnostic body truncated at 8 KiB]' : '');
}

/** Only these two read operations are available; no discovery or remote writes. */
export type TencentReadOperation = 'getFields' | 'getRecords';

export class TencentDocsClient {
  private credentials?: TencentCredentials;

  constructor(private readonly signal: AbortSignal, private readonly maxRetries: number) {}

  async connect(credentials: TencentCredentials): Promise<void> {
    for (const key of ['clientId', 'openId', 'accessToken'] as const) {
      const value = credentials[key];
      if (typeof value !== 'string' || !value.trim() || /[^\x21-\x7e]/.test(value)) {
        throw new TencentDocsError(`Set a valid ${key} or its TENCENT_DOCS environment variable.`);
      }
    }
    this.credentials = credentials;
  }

  async call(operation: TencentReadOperation, args: Record<string, unknown>): Promise<Record<string, unknown>> {
    if (operation !== 'getFields' && operation !== 'getRecords') {
      throw new TencentDocsError('Only SmartSheet field and record read operations are allowed.');
    }
    if (!this.credentials) throw new TencentDocsError('OpenAPI credentials are not configured.');
    const { fileId, sheetId, ...params } = args;
    if (typeof fileId !== 'string' || !fileId || typeof sheetId !== 'string' || !sheetId) {
      throw new TencentDocsError('Explicit native fileId and sheetId are required.');
    }
    const url = `https://docs.qq.com/openapi/smartbook/v2/files/${encodeURIComponent(
      fileId
    )}/sheets/${encodeURIComponent(sheetId)}`;
    const credentials = this.credentials;
    const secrets = [
      ...new Set(Object.values(credentials).flatMap((value) => [value, JSON.stringify(value).slice(1, -1)])),
    ].sort((a, b) => b.length - a.length);
    try {
      for (let attempt = 0; ; attempt++) {
        this.signal.throwIfAborted();
        let response: Response;
        try {
          response = await fetch(url, {
            method: 'POST',
            headers: {
              'Access-Token': credentials.accessToken,
              'Client-Id': credentials.clientId,
              'Open-Id': credentials.openId,
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            body: JSON.stringify({ [operation]: params }),
            redirect: 'error',
            signal: this.signal,
          });
        } catch (error) {
          if (this.signal.aborted || attempt >= this.maxRetries) throw error;
          await delay(500 * 2 ** attempt, undefined, { signal: this.signal });
          continue;
        }
        const retryAfter = response.headers.get('Retry-After');
        const waitMs =
          retryAfter === null
            ? 500 * 2 ** attempt
            : Math.max(0, /^\d+$/.test(retryAfter) ? Number(retryAfter) * 1000 : Date.parse(retryAfter) - Date.now());
        if (
          [429, 500, 502, 503, 504].includes(response.status) &&
          attempt < this.maxRetries &&
          Number.isFinite(waitMs) &&
          waitMs <= 30000
        ) {
          await response.body?.cancel();
          await delay(waitMs, undefined, { signal: this.signal });
          continue;
        }
        // Bound even stalled body reads by the same whole-load deadline.
        const { text, truncated } = await this.readBody(response, response.ok ? 16 * 1024 * 1024 : 8192);
        let body: unknown;
        try {
          body = JSON.parse(text);
        } catch {
          /* Keep non-JSON HTTP diagnostics only on failure. */
        }
        const requestId = response.headers.get('x-request-id') ?? response.headers.get('x-log-id');
        if (!response.ok || (isObject(body) && typeof body.ret === 'number' && body.ret !== 0)) {
          const code = isObject(body) && typeof body.ret === 'number' ? body.ret : undefined;
          const diagnostic = diagnosticBody(text, secrets, truncated);
          throw new TencentDocsError(
            `OpenAPI request failed (HTTP ${response.status}${code === undefined ? '' : `, ret ${code}`}).${
              requestId ? ` Request ID: ${requestId}.` : ''
            } ${diagnostic}`,
            code,
            {
              body:
                !truncated &&
                isObject(body) &&
                Buffer.byteLength(JSON.stringify(redactCredentials(body, secrets)), 'utf8') <= 8192
                  ? body
                  : diagnostic,
              requestId,
            },
            response.status
          );
        }
        if (!isObject(body) || body.ret !== 0 || !isObject(body.data) || !isObject(body.data[operation])) {
          throw new TencentDocsError('Invalid OpenAPI response envelope.');
        }
        return body.data[operation] as Record<string, unknown>;
      }
    } catch (error) {
      const cause = redactCredentials(error, secrets);
      if (this.signal.aborted) throw new TencentDocsError('Load deadline exceeded.', undefined, cause);
      throw cause;
    }
  }

  private async readBody(response: Response, maximum: number): Promise<{ text: string; truncated: boolean }> {
    const reader = response.body?.getReader();
    if (!reader) return { text: '', truncated: false };
    const abort = () => {
      void reader.cancel().catch(() => undefined);
    };
    this.signal.addEventListener('abort', abort, { once: true });
    const decoder = new TextDecoder();
    let text = '';
    let bytes = 0;
    try {
      this.signal.throwIfAborted();
      for (;;) {
        const { done, value } = await reader.read();
        this.signal.throwIfAborted();
        if (done) return { text: text + decoder.decode(), truncated: false };
        const remaining = maximum - bytes;
        if (value.byteLength > remaining && response.ok)
          throw new TencentDocsError('OpenAPI response exceeds the 16 MiB read limit.');
        text += decoder.decode(value.subarray(0, remaining), { stream: true });
        bytes += value.byteLength;
        // Do not flush a partial UTF-8 character or append a marker here: the
        // raw boundary must remain visible to credential-prefix protection.
        if (!response.ok && bytes >= maximum) return { text, truncated: true };
      }
    } finally {
      this.signal.removeEventListener('abort', abort);
      await reader.cancel().catch(() => undefined);
    }
  }

  async close(): Promise<void> {
    this.credentials = undefined;
  }
}
