import { setTimeout as delay } from 'node:timers/promises';

export class TencentSmartsheetError extends Error {
  constructor(message: string, readonly code?: number, readonly cause?: unknown, readonly status?: number) {
    super(`Tencent Docs: ${message}`);
    this.name = 'TencentSmartsheetError';
  }
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export interface TencentSmartsheetCredentials {
  clientId: string;
  openId: string;
  accessToken: string;
}

/** Keep only documented string diagnostics, never an arbitrary response/error object.
 * Omit oversized fields whole instead of cutting through a credential or UTF-8 character.
 */
function diagnosticText(value: unknown, credentials: TencentSmartsheetCredentials): string | undefined {
  if (typeof value !== 'string') return undefined;
  if (Buffer.byteLength(value, 'utf8') > 8192) return '[diagnostic omitted: exceeds 8 KiB]';
  let text = value;
  for (const secret of Object.values(credentials)) text = text.split(secret).join('[REDACTED]');
  return Buffer.byteLength(text, 'utf8') <= 8192 ? text : '[diagnostic omitted: exceeds 8 KiB]';
}

function errorDetails(error: unknown, credentials: TencentSmartsheetCredentials) {
  if (!isObject(error)) return { message: diagnosticText(String(error), credentials) };
  return {
    name: diagnosticText(error.name, credentials),
    message: diagnosticText(error.message, credentials),
    code: diagnosticText(error.code, credentials),
  };
}

/** Only these two read operations are available; no discovery or remote writes. */
export type TencentSmartsheetReadOperation = 'getFields' | 'getRecords';

export class TencentSmartsheetClient {
  constructor(
    private readonly credentials: TencentSmartsheetCredentials,
    private readonly signal: AbortSignal,
    private readonly maxRetries: number
  ) {
    for (const key of ['clientId', 'openId', 'accessToken'] as const) {
      const value = credentials[key];
      if (typeof value !== 'string' || !value.trim() || /[^\x21-\x7e]/.test(value)) {
        throw new TencentSmartsheetError(`Set a valid ${key} in options.`);
      }
    }
  }

  async call(operation: TencentSmartsheetReadOperation, args: Record<string, unknown>): Promise<Record<string, unknown>> {
    if (operation !== 'getFields' && operation !== 'getRecords') {
      throw new TencentSmartsheetError('Only SmartSheet field and record read operations are allowed.');
    }
    const { fileId, sheetId, ...params } = args;
    if (typeof fileId !== 'string' || !fileId || typeof sheetId !== 'string' || !sheetId) {
      throw new TencentSmartsheetError('Explicit native fileId and sheetId are required.');
    }
    const url = `https://docs.qq.com/openapi/smartbook/v2/files/${encodeURIComponent(
      fileId
    )}/sheets/${encodeURIComponent(sheetId)}`;
    const credentials = this.credentials;
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
          /* Non-JSON bodies are not exposed; retain HTTP status and request ID below. */
        }
        const requestId = diagnosticText(
          response.headers.get('x-request-id') ?? response.headers.get('x-log-id'),
          credentials
        );
        if (!response.ok || (isObject(body) && typeof body.ret === 'number' && body.ret !== 0)) {
          const code = isObject(body) && typeof body.ret === 'number' ? body.ret : undefined;
          const message = truncated ? undefined : diagnosticText(isObject(body) ? body.msg : undefined, credentials);
          throw new TencentSmartsheetError(
            `OpenAPI request failed (HTTP ${response.status}${code === undefined ? '' : `, ret ${code}`}).${
              requestId ? ` Request ID: ${requestId}.` : ''
            }${message ? ` ${message}` : ''}`,
            code,
            { ret: code, msg: message, requestId },
            response.status
          );
        }
        if (!isObject(body) || body.ret !== 0 || !isObject(body.data) || !isObject(body.data[operation])) {
          throw new TencentSmartsheetError('Invalid OpenAPI response envelope.');
        }
        return body.data[operation] as Record<string, unknown>;
      }
    } catch (error) {
      if (error instanceof TencentSmartsheetError) throw error;
      const cause = {
        ...errorDetails(error, credentials),
        cause: isObject(error) && error.cause !== undefined ? errorDetails(error.cause, credentials) : undefined,
      };
      if (this.signal.aborted) throw new TencentSmartsheetError('Load deadline exceeded.', undefined, cause);
      throw new TencentSmartsheetError(
        `OpenAPI transport failed.${cause.message ? ` ${cause.message}` : ''}`,
        undefined,
        cause
      );
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
          throw new TencentSmartsheetError('OpenAPI response exceeds the 16 MiB read limit.');
        text += decoder.decode(value.subarray(0, remaining), { stream: true });
        bytes += value.byteLength;
        // A partial/non-JSON error body is never included in diagnostics.
        if (!response.ok && bytes >= maximum) return { text, truncated: true };
      }
    } finally {
      this.signal.removeEventListener('abort', abort);
      await reader.cancel().catch(() => undefined);
    }
  }
}
