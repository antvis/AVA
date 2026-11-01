import { createVerify, generateKeyPairSync } from 'crypto';
import { mkdir, mkdtemp, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BIGQUERY_SCOPE, googleAuth } from '../../../src/remote/bigquery/auth';

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  publicKeyEncoding: { type: 'spki', format: 'pem' },
});

const SERVICE_ACCOUNT = {
  type: 'service_account' as const,
  project_id: 'key-project',
  private_key_id: 'key-1',
  private_key: privateKey,
  client_email: 'reader@key-project.iam.gserviceaccount.com',
  token_uri: 'https://oauth2.googleapis.com/token',
};

const USER = {
  type: 'authorized_user' as const,
  client_id: 'client-id',
  client_secret: 'client-secret',
  refresh_token: 'refresh-token',
  quota_project_id: 'quota-project',
};

type FetchMock = (url: string, init: { body?: unknown; headers?: unknown }) => Promise<Response>;

function tokenResponse(token: string, expiresIn = 3600) {
  return Response.json({ access_token: token, expires_in: expiresIn, token_type: 'Bearer' });
}

function decode(part: string) {
  return JSON.parse(Buffer.from(part, 'base64url').toString('utf8'));
}

let directory: string;

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), 'ava-bigquery-auth-'));
  // Keep developer credentials and cloud metadata servers out of the tests.
  vi.stubEnv('GOOGLE_APPLICATION_CREDENTIALS', '');
  vi.stubEnv('CLOUDSDK_CONFIG', join(directory, 'gcloud'));
  vi.stubEnv('GCE_METADATA_HOST', 'metadata.test');
});

afterEach(async () => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.useRealTimers();
  await rm(directory, { recursive: true, force: true });
});

describe('googleAuth', () => {
  it('exchanges a signed service account assertion and caches the token', async () => {
    const fetch = vi.fn<FetchMock>(async () => tokenResponse('token-1'));
    vi.stubGlobal('fetch', fetch);

    const auth = await googleAuth({ credentials: SERVICE_ACCOUNT });
    expect(auth.projectId).toBe('key-project');
    await expect(auth.token()).resolves.toBe('token-1');
    await expect(auth.token()).resolves.toBe('token-1');
    expect(fetch).toHaveBeenCalledOnce();

    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe(SERVICE_ACCOUNT.token_uri);
    const form = new URLSearchParams(String(init.body));
    expect(form.get('grant_type')).toBe('urn:ietf:params:oauth:grant-type:jwt-bearer');
    const [header, claims, signature] = form.get('assertion')!.split('.');
    expect(decode(header)).toEqual({ alg: 'RS256', typ: 'JWT', kid: 'key-1' });
    const payload = decode(claims);
    expect(payload).toMatchObject({
      iss: SERVICE_ACCOUNT.client_email,
      scope: BIGQUERY_SCOPE,
      aud: SERVICE_ACCOUNT.token_uri,
    });
    expect(payload.exp - payload.iat).toBe(3600);
    const verifier = createVerify('RSA-SHA256').update(`${header}.${claims}`);
    expect(verifier.verify(publicKey, signature, 'base64url')).toBe(true);
  });

  it('refreshes a minute before expiry and shares one refresh between concurrent callers', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    let issued = 0;
    const fetch = vi.fn(async () => tokenResponse(`token-${++issued}`, 120));
    vi.stubGlobal('fetch', fetch);
    const auth = await googleAuth({ credentials: SERVICE_ACCOUNT });

    await expect(auth.token()).resolves.toBe('token-1');
    vi.setSystemTime(new Date('2026-01-01T00:00:59Z'));
    await expect(auth.token()).resolves.toBe('token-1');
    vi.setSystemTime(new Date('2026-01-01T00:01:01Z'));
    await expect(Promise.all([auth.token(), auth.token(), auth.token()])).resolves.toEqual([
      'token-2',
      'token-2',
      'token-2',
    ]);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('does not cache failed token requests or echo secrets in errors', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({ error: 'invalid_grant', error_description: 'Invalid JWT Signature.' }, { status: 400 })
      )
      .mockResolvedValueOnce(tokenResponse('token-2'));
    vi.stubGlobal('fetch', fetch);
    const auth = await googleAuth({ credentials: SERVICE_ACCOUNT });

    const error = await auth.token().catch((reason: Error) => reason);
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe(
      'Google OAuth token request failed (400): invalid_grant: Invalid JWT Signature.'
    );
    await expect(auth.token()).resolves.toBe('token-2');
  });

  it('refreshes gcloud user credentials and uses their quota project', async () => {
    const fetch = vi.fn<FetchMock>(async () => tokenResponse('user-token'));
    vi.stubGlobal('fetch', fetch);

    const auth = await googleAuth({ credentials: USER });
    expect(auth.projectId).toBe('quota-project');
    await expect(auth.token()).resolves.toBe('user-token');
    expect(Object.fromEntries(new URLSearchParams(String(fetch.mock.calls[0][1].body)))).toEqual({
      grant_type: 'refresh_token',
      client_id: 'client-id',
      client_secret: 'client-secret',
      refresh_token: 'refresh-token',
    });
  });

  it('passes caller tokens through without contacting Google', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const provider = vi.fn(async () => 'fresh-token');

    await expect((await googleAuth({ accessToken: 'static-token' })).token()).resolves.toBe('static-token');
    await expect((await googleAuth({ accessToken: provider })).token()).resolves.toBe('fresh-token');
    expect(provider).toHaveBeenCalledOnce();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('reads key files, GOOGLE_APPLICATION_CREDENTIALS and the gcloud credentials file', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => tokenResponse('file-token'))
    );
    const key = join(directory, 'key.json');
    await writeFile(key, JSON.stringify(SERVICE_ACCOUNT));
    expect((await googleAuth({ keyFilename: key })).projectId).toBe('key-project');

    vi.stubEnv('GOOGLE_APPLICATION_CREDENTIALS', key);
    expect((await googleAuth({})).projectId).toBe('key-project');

    vi.stubEnv('GOOGLE_APPLICATION_CREDENTIALS', '');
    await mkdir(join(directory, 'gcloud'));
    await writeFile(join(directory, 'gcloud', 'application_default_credentials.json'), JSON.stringify(USER));
    const auth = await googleAuth({});
    expect(auth.projectId).toBe('quota-project');
    await expect(auth.token()).resolves.toBe('file-token');
  });

  it('uses the metadata server only when it identifies as Google', async () => {
    const fetch = vi.fn<FetchMock>(async (url) =>
      url.endsWith('project/project-id')
        ? new Response('gce-project', { headers: { 'Metadata-Flavor': 'Google' } })
        : tokenResponse('metadata-token')
    );
    vi.stubGlobal('fetch', fetch);

    const auth = await googleAuth({});
    expect(auth.projectId).toBe('gce-project');
    await expect(auth.token()).resolves.toBe('metadata-token');
    expect(fetch.mock.calls.map(([url]) => url)).toEqual([
      'http://metadata.test/computeMetadata/v1/project/project-id',
      `http://metadata.test/computeMetadata/v1/instance/service-accounts/default/token?scopes=${encodeURIComponent(
        BIGQUERY_SCOPE
      )}`,
    ]);
    expect(fetch.mock.calls.every(([, init]) => (init.headers as Record<string, string>)['Metadata-Flavor'])).toBe(
      true
    );

    // Another cloud's metadata service answers without the Google header.
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('not google'))
    );
    await expect(googleAuth({})).rejects.toThrow('No Google credentials found for BigQuery');
  });

  it('rejects ambiguous, unsupported and malformed credentials', async () => {
    await expect(googleAuth({ accessToken: 'token', keyFilename: 'key.json' })).rejects.toThrow(
      'only one of accessToken, credentials or keyFilename; got accessToken, keyFilename'
    );
    await expect(googleAuth({ accessToken: '' })).rejects.toThrow('non-empty string');
    await expect(googleAuth({ credentials: { type: 'external_account' } as never })).rejects.toThrow(
      'Unsupported Google credential type "external_account" in credentials'
    );
    await expect(googleAuth({ credentials: { type: 'service_account', client_email: 'x' } as never })).rejects.toThrow(
      'require client_email and private_key'
    );
    await expect(googleAuth({ keyFilename: join(directory, 'missing.json') })).rejects.toThrow(
      'Google credentials file not found'
    );
    await writeFile(join(directory, 'broken.json'), '{');
    await expect(googleAuth({ keyFilename: join(directory, 'broken.json') })).rejects.toThrow('not valid JSON');

    vi.stubGlobal('fetch', vi.fn());
    const auth = await googleAuth({ credentials: { ...SERVICE_ACCOUNT, private_key: 'not a key' } });
    const error = await auth.token().catch((reason: Error) => reason);
    expect((error as Error).message).toBe(
      'Google service account private_key in credentials is not a valid PEM private key'
    );
  });
});
