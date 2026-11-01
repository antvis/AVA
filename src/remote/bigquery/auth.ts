/**
 * Google OAuth 2.0 access tokens for the BigQuery API without additional dependencies:
 * caller-supplied tokens, service account keys (JWT bearer grant), gcloud user credentials
 * (refresh token grant), and the metadata server of Google Cloud runtimes.
 * https://developers.google.com/identity/protocols/oauth2/service-account#httprest
 * https://cloud.google.com/docs/authentication/application-default-credentials
 */
import { createSign } from 'crypto';
import { readFile } from 'fs/promises';
import { homedir } from 'os';
import { join } from 'path';

import { BigQueryError, errorText } from './api';

import type { BigQuerySourceOptions } from '../../types';

export const BIGQUERY_SCOPE = 'https://www.googleapis.com/auth/bigquery';
const TOKEN_URI = 'https://oauth2.googleapis.com/token';
const TOKEN_TIMEOUT_MS = 30_000;
const METADATA_PROBE_TIMEOUT_MS = 3_000;
/** Refresh a token this long before it expires. */
const EXPIRY_MARGIN_MS = 60_000;

export interface GoogleAuth {
  /** Return a current OAuth 2.0 access token. */
  token: () => Promise<string>;
  /** Project named by the credentials, if any. */
  projectId?: string;
}

interface AccessToken {
  value: string;
  expiresAt: number;
}

/** Reuse a token until shortly before it expires; concurrent callers share one refresh. */
function cached(fetchToken: () => Promise<AccessToken>): () => Promise<string> {
  let current: Promise<AccessToken> | undefined;
  const refresh = () => {
    const request = fetchToken();
    current = request;
    request.catch(() => {
      if (current === request) current = undefined;
    });
    return request;
  };
  return async () => {
    const request = current ?? refresh();
    const token = await request;
    if (token.expiresAt - EXPIRY_MARGIN_MS > Date.now()) return token.value;
    return (await (current === request ? refresh() : current ?? refresh())).value;
  };
}

/** Read an OAuth 2.0 token response; errors name the endpoint but never echo the request. */
async function accessToken(label: string, request: () => Promise<Response>): Promise<AccessToken> {
  let response: Response;
  try {
    response = await request();
  } catch (error) {
    throw new BigQueryError(`${label} failed: ${errorText(error)}`);
  }
  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok || typeof payload.access_token !== 'string') {
    // OAuth error responses (RFC 6749 §5.2) carry an error code and description, no secrets.
    const detail = [payload.error, payload.error_description].filter((part) => typeof part === 'string').join(': ');
    throw new BigQueryError(`${label} failed (${response.status})${detail ? `: ${detail}` : ''}`, {
      status: response.status,
    });
  }
  const seconds = Number(payload.expires_in);
  return { value: payload.access_token, expiresAt: Date.now() + (seconds > 0 ? seconds : 3600) * 1000 };
}

function requestToken(uri: string, form: Record<string, string>): Promise<AccessToken> {
  return accessToken('Google OAuth token request', () =>
    fetch(uri, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(form).toString(),
      signal: AbortSignal.timeout(TOKEN_TIMEOUT_MS),
    })
  );
}

function serviceAccount(key: Record<string, unknown>, source: string): GoogleAuth {
  const { client_email: email, private_key: privateKey, private_key_id: keyId, token_uri: tokenUri } = key;
  if (typeof email !== 'string' || typeof privateKey !== 'string') {
    throw new Error(`Google service account credentials in ${source} require client_email and private_key`);
  }
  const audience = typeof tokenUri === 'string' ? tokenUri : TOKEN_URI;
  const base64url = (value: string) => Buffer.from(value).toString('base64url');
  return {
    projectId: typeof key.project_id === 'string' ? key.project_id : undefined,
    token: cached(async () => {
      const now = Math.floor(Date.now() / 1000);
      const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT', ...(keyId ? { kid: keyId } : {}) }));
      const claims = base64url(
        JSON.stringify({ iss: email, scope: BIGQUERY_SCOPE, aud: audience, iat: now, exp: now + 3600 })
      );
      let signature: string;
      try {
        signature = createSign('RSA-SHA256').update(`${header}.${claims}`).sign(privateKey, 'base64url');
      } catch {
        throw new Error(`Google service account private_key in ${source} is not a valid PEM private key`);
      }
      return requestToken(audience, {
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: `${header}.${claims}.${signature}`,
      });
    }),
  };
}

function authorizedUser(user: Record<string, unknown>, source: string): GoogleAuth {
  const { client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken } = user;
  if (typeof clientId !== 'string' || typeof clientSecret !== 'string' || typeof refreshToken !== 'string') {
    throw new Error(`Google user credentials in ${source} require client_id, client_secret and refresh_token`);
  }
  return {
    projectId: typeof user.quota_project_id === 'string' ? user.quota_project_id : undefined,
    token: cached(() =>
      requestToken(TOKEN_URI, {
        grant_type: 'refresh_token',
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
      })
    ),
  };
}

function fromJSON(credentials: unknown, source: string): GoogleAuth {
  const value = (credentials ?? {}) as Record<string, unknown>;
  if (value.type === 'service_account') return serviceAccount(value, source);
  if (value.type === 'authorized_user') return authorizedUser(value, source);
  throw new Error(
    `Unsupported Google credential type ${JSON.stringify(value.type ?? null)} in ${source}. ` +
      'Use a service account key or gcloud application-default credentials, or pass accessToken.'
  );
}

async function readCredentials(path: string, optional = false): Promise<unknown> {
  let text: string;
  try {
    text = await readFile(path, 'utf8');
  } catch (error) {
    if ((error as { code?: string }).code !== 'ENOENT') throw error;
    if (optional) return undefined;
    throw new Error(`Google credentials file not found: ${path}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Google credentials file is not valid JSON: ${path}`);
  }
}

/** Location written by `gcloud auth application-default login`. */
function gcloudCredentialsPath(): string {
  const directory =
    process.env.CLOUDSDK_CONFIG ||
    (process.platform === 'win32'
      ? join(process.env.APPDATA || join(homedir(), 'AppData', 'Roaming'), 'gcloud')
      : join(homedir(), '.config', 'gcloud'));
  return join(directory, 'application_default_credentials.json');
}

function metadataUrl(path: string): string {
  return `http://${process.env.GCE_METADATA_HOST || '169.254.169.254'}/computeMetadata/v1/${path}`;
}

/** Return the runtime's project ID when a Google Cloud metadata server answers, otherwise undefined. */
async function metadataProject(): Promise<string | undefined> {
  try {
    const response = await fetch(metadataUrl('project/project-id'), {
      headers: { 'Metadata-Flavor': 'Google' },
      signal: AbortSignal.timeout(METADATA_PROBE_TIMEOUT_MS),
    });
    // Other clouds also serve 169.254.169.254; only Google's server echoes this header.
    if (!response.ok || response.headers.get('metadata-flavor') !== 'Google') return undefined;
    return (await response.text()).trim();
  } catch {
    return undefined;
  }
}

function metadataServer(projectId: string): GoogleAuth {
  const path = `instance/service-accounts/default/token?scopes=${encodeURIComponent(BIGQUERY_SCOPE)}`;
  return {
    projectId: projectId || undefined,
    token: cached(() =>
      accessToken('Metadata server token request', () =>
        fetch(metadataUrl(path), {
          headers: { 'Metadata-Flavor': 'Google' },
          signal: AbortSignal.timeout(TOKEN_TIMEOUT_MS),
        })
      )
    ),
  };
}

/**
 * Resolve credentials: an explicit accessToken, credentials or keyFilename; otherwise Application Default
 * Credentials from GOOGLE_APPLICATION_CREDENTIALS, the gcloud credentials file, or the metadata server.
 */
export async function googleAuth(
  options: Pick<BigQuerySourceOptions, 'accessToken' | 'credentials' | 'keyFilename'>
): Promise<GoogleAuth> {
  const explicit = (['accessToken', 'credentials', 'keyFilename'] as const).filter((key) => options[key] !== undefined);
  if (explicit.length > 1) {
    throw new Error(
      `BigQuery sources accept only one of accessToken, credentials or keyFilename; got ${explicit.join(', ')}`
    );
  }

  const { accessToken: token, credentials, keyFilename } = options;
  if (typeof token === 'function') return { token };
  if (token !== undefined) {
    if (typeof token !== 'string' || !token) {
      throw new Error('BigQuery accessToken must be a non-empty string');
    }
    return { token: async () => token };
  }
  if (credentials !== undefined) return fromJSON(credentials, 'credentials');
  if (keyFilename !== undefined) return fromJSON(await readCredentials(keyFilename), keyFilename);

  const file = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (file) return fromJSON(await readCredentials(file), file);

  const gcloud = gcloudCredentialsPath();
  const user = await readCredentials(gcloud, true);
  if (user !== undefined) return fromJSON(user, gcloud);

  const projectId = await metadataProject();
  if (projectId !== undefined) return metadataServer(projectId);

  throw new Error(
    'No Google credentials found for BigQuery. Set keyFilename, credentials or accessToken in the source options, ' +
      'set GOOGLE_APPLICATION_CREDENTIALS, or run `gcloud auth application-default login`.'
  );
}
