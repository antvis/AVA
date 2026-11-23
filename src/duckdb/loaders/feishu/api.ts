import { feishuError } from './token';

/** Open API origin and bearer token used for one load. */
export interface FeishuApi {
  token: string;
  origin: string;
}

interface RequestOptions {
  method?: 'GET' | 'POST';
  query?: Record<string, string | number | undefined>;
  body?: unknown;
}

const REQUEST_TIMEOUT_MS = 30_000;
const MAX_ATTEMPTS = 4;
const RETRY_BASE_MS = 500;

/**
 * Error codes the Bitable API documents as transient: too many requests, write
 * conflict, data not ready and request timeout, plus the gateway frequency limit.
 */
const RETRYABLE_CODES = new Set([1254290, 1254291, 1254607, 1255040, 99991400]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

/** Exponential backoff with jitter: about 0.5 s, 1 s and 2 s before the retries. */
function retryDelay(attempt: number): Promise<void> {
  const ms = RETRY_BASE_MS * 2 ** (attempt - 1) * (0.75 + Math.random() / 2);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Call a Feishu Open API endpoint and unwrap `data`.
 *
 * Rate limits, timeouts and other transient failures are retried with backoff;
 * other errors keep the original Feishu code and message.
 */
export async function feishuRequest(
  api: FeishuApi,
  path: string,
  { method = 'GET', query = {}, body }: RequestOptions = {}
): Promise<Record<string, unknown>> {
  const url = new URL(path, api.origin);
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }
  const headers: Record<string, string> = { Authorization: `Bearer ${api.token}` };
  if (body !== undefined) headers['Content-Type'] = 'application/json; charset=utf-8';

  for (let attempt = 1; ; attempt += 1) {
    const retry = attempt < MAX_ATTEMPTS;
    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      if (retry) {
        await retryDelay(attempt);
        continue;
      }
      // Keep the original transport error: the request URL carries the app token.
      throw error;
    }
    const payload: unknown = await response.json().catch(() => undefined);
    if (!isRecord(payload)) {
      if (retry && (response.status === 429 || response.status >= 500)) {
        await retryDelay(attempt);
        continue;
      }
      throw feishuError(undefined, `response is not JSON (HTTP ${response.status})`);
    }
    if (payload.code === 0) return isRecord(payload.data) ? payload.data : {};
    if (retry && (RETRYABLE_CODES.has(Number(payload.code)) || response.status === 429 || response.status >= 500)) {
      await retryDelay(attempt);
      continue;
    }
    throw feishuError(payload.code, payload.msg);
  }
}

export interface FeishuPage {
  items: Record<string, unknown>[];
  /** Total item count reported by the API, when it reports one. */
  total?: number;
}

/**
 * Read every page of a paginated endpoint. A repeated page token or `has_more`
 * without a token would loop or truncate, so both are reported as errors.
 */
export async function feishuPages(
  api: FeishuApi,
  path: string,
  { pageSize, ...options }: RequestOptions & { pageSize: number }
): Promise<FeishuPage> {
  const items: Record<string, unknown>[] = [];
  const seen = new Set<string>();
  let total: number | undefined;
  let pageToken: string | undefined;
  do {
    const data = await feishuRequest(api, path, {
      ...options,
      query: { ...options.query, page_size: pageSize, page_token: pageToken },
    });
    if (Array.isArray(data.items)) items.push(...data.items.filter(isRecord));
    if (typeof data.total === 'number') total = data.total;
    const hasMore = data.has_more === true;
    pageToken = hasMore && typeof data.page_token === 'string' && data.page_token ? data.page_token : undefined;
    if (hasMore && !pageToken) throw new Error('Feishu pagination returned has_more without page_token');
    if (pageToken) {
      if (seen.has(pageToken)) throw new Error('Feishu pagination returned a repeated page_token');
      seen.add(pageToken);
    }
  } while (pageToken);
  return { items, total };
}
