import type { FeishuApi } from './api';
import type { FeishuBitableSourceOptions } from '../../../types';

const FEISHU_ORIGIN = 'https://open.feishu.cn';
const LARK_ORIGIN = 'https://open.larksuite.com';
const larkHost = /(^|\.)larksuite\.com$/;

function isLarkUrl(url?: string): boolean {
  if (!url || !/^https?:\/\//i.test(url)) return false;
  return larkHost.test(new URL(url).hostname.toLowerCase());
}

/** Open Platform origin for a Bitable link: Lark links use open.larksuite.com. */
export function feishuOrigin(url?: string): string {
  return isLarkUrl(url) ? LARK_ORIGIN : FEISHU_ORIGIN;
}

export function feishuError(code: unknown, msg: unknown): Error {
  return new Error(`Feishu Error ${code}: ${msg}`);
}

export async function getTenantAccessToken(appId: string, appSecret: string, origin = FEISHU_ORIGIN): Promise<string> {
  const response = await fetch(`${origin}/open-apis/auth/v3/tenant_access_token/internal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_id: appId, app_secret: appSecret }),
    signal: AbortSignal.timeout(30_000),
  });
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw feishuError(undefined, 'response is not JSON');
  }
  if (!body || typeof body !== 'object') {
    throw feishuError(undefined, 'response is not JSON');
  }
  const payload = body as { code?: unknown; msg?: unknown; tenant_access_token?: unknown };
  if (payload.code !== 0 || typeof payload.tenant_access_token !== 'string' || !payload.tenant_access_token) {
    throw feishuError(payload.code, payload.msg);
  }
  return payload.tenant_access_token;
}

export type FeishuAuthType = 'app' | 'accessToken';

/** Which credential a source config uses; exactly one kind must be present. */
export function feishuAuthType(options: FeishuBitableSourceOptions): FeishuAuthType {
  const types: FeishuAuthType[] = [];
  if (options.appId || options.appSecret) types.push('app');
  if (options.accessToken) types.push('accessToken');
  if (types.length !== 1) {
    throw new Error(
      types.length === 0
        ? 'Feishu Bitable source requires appId and appSecret, or accessToken'
        : `Feishu Bitable source accepts one credential, got ${types.join(' and ')}`
    );
  }
  if (types[0] === 'app' && !(options.appId && options.appSecret)) {
    throw new Error('Feishu Bitable source requires both appId and appSecret');
  }
  return types[0];
}

/**
 * Resolve the origin and bearer token for a source config.
 *
 * - appId/appSecret: an internal app exchanges them for a tenant access token.
 * - accessToken: a tenant or user access token obtained by the host application.
 */
export async function feishuApi(options: FeishuBitableSourceOptions): Promise<FeishuApi> {
  switch (feishuAuthType(options)) {
    case 'accessToken':
      return { origin: feishuOrigin(options.url), token: options.accessToken! };
    case 'app': {
      const origin = feishuOrigin(options.url);
      return { origin, token: await getTenantAccessToken(options.appId!, options.appSecret!, origin) };
    }
  }
}
