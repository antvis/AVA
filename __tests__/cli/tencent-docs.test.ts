import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { run } from '../../src/cli/commands/source';
import { createSession } from '../../src/cli/session/client';
import { sourceConfig } from '../../src/cli/session/protocol';

vi.mock('../../src/cli/session/client', () => ({ createSession: vi.fn() }));
afterEach(() => {
  vi.clearAllMocks();
});
const config = { type: 'tencent-smartsheet', options: { fileId: 'file', sheetId: 'sheet' } };

describe('Tencent Docs CLI source config', () => {
  it('accepts a token-free config so the loader can use the inherited environment', async () => {
    expect(sourceConfig.parse(config)).toEqual(config);
    const directory = await mkdtemp(join(tmpdir(), 'ava-tencent-cli-'));
    try {
      const file = join(directory, 'source.json');
      await writeFile(file, JSON.stringify(config));
      await run([`@${file}`], {});
      expect(createSession).toHaveBeenCalledWith(config, expect.any(Object), undefined);
      expect(config.options).not.toHaveProperty('token');
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('accepts the explicit OpenAPI credential contract', () => {
    const explicit = {
      ...config,
      options: { ...config.options, clientId: 'client', openId: 'open', accessToken: 'access' },
    };
    expect(sourceConfig.parse(explicit)).toEqual(explicit);
  });

  it('rejects unsupported engines before starting a session', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'ava-tencent-cli-'));
    try {
      const file = join(directory, 'source.json');
      await writeFile(file, JSON.stringify(config));
      await expect(run([`@${file}`], { engine: 'python' })).rejects.toThrow('require the duckdb engine');
      expect(createSession).not.toHaveBeenCalled();
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it.each([
    { fileId: 'file' },
    { fileId: 'file', sheetId: 'sheet', token: 'obsolete-mcp-token' },
    { fileId: 'file', sheetId: 'sheet', pageSize: 101 },
    { fileId: 'file', sheetId: 'sheet', endpoint: 'https://other-host.invalid' },
  ])('rejects invalid or unknown options', (options) => {
    expect(() => sourceConfig.parse({ type: config.type, options })).toThrow();
  });
});
