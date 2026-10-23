import { feishuError } from './token';

export interface FeishuApi {
  token: string;
  origin: string;
}

/**
 * GET a Feishu Open API endpoint with a tenant access token and unwrap `data`.
 */
export async function feishuGet(url: string, token: string): Promise<Record<string, unknown>> {
  let response: Response;
  try {
    response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  } catch (error) {
    const reason = (error as Error)?.message ?? String(error);
    throw new Error(`Feishu request failed: ${url} (${reason})`);
  }
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw feishuError(undefined, 'response is not JSON');
  }
  if (!body || typeof body !== 'object') {
    throw feishuError(undefined, 'response is not JSON');
  }
  const payload = body as { code?: unknown; msg?: unknown; data?: unknown };
  if (payload.code !== 0) {
    throw feishuError(payload.code, payload.msg);
  }
  return payload.data && typeof payload.data === 'object' ? (payload.data as Record<string, unknown>) : {};
}
