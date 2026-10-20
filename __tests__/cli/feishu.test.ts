import { mkdir, mkdtemp, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { feishuCredentials, feishuUrl, isFeishuBitableUrl, isFeishuHostUrl } from '../../src/cli/feishu';

const baseUrl = 'https://my.feishu.cn/base/AXuDbVoV7aKqzpslXwscP41Wncc?table=tblehsChh5T3X69i&view=vewfxHhZEb';
const credentials = { appId: 'cli_test_app', appSecret: 'test-secret' };

let home: string | undefined;
const originalHome = process.env.HOME;
const stdinDescriptor = Object.getOwnPropertyDescriptor(process.stdin, 'isTTY');

beforeEach(() => {
  vi.stubEnv('AVA_FEISHU_APP_ID', '');
  vi.stubEnv('AVA_FEISHU_APP_SECRET', '');
  Object.defineProperty(process.stdin, 'isTTY', { configurable: true, value: false });
});

afterEach(async () => {
  vi.unstubAllEnvs();
  if (originalHome === undefined) delete process.env.HOME;
  else process.env.HOME = originalHome;
  if (home) await rm(home, { recursive: true, force: true });
  home = undefined;
  if (stdinDescriptor) Object.defineProperty(process.stdin, 'isTTY', stdinDescriptor);
  else Reflect.deleteProperty(process.stdin, 'isTTY');
});

describe('Feishu URL detection', () => {
  it.each([
    ['https://my.feishu.cn/base/appToken?table=tbl123', true],
    ['https://acme.larksuite.com/base/appToken?table=tbl123', true],
    ['https://my.feishu.cn/base/appToken?table=tbl123&view=vew1', true],
    ['https://my.feishu.cn/base/appToken', false],
    ['https://my.feishu.cn/wiki/wikcn123?table=tbl123', false],
    ['https://my.feishu.cn/docx/doccn123', false],
    ['https://my.feishu.cn/sheets/shtcn123', false],
    ['https://example.com/base/appToken?table=tbl123', false],
    ['/data/sales.csv', false],
  ])('isFeishuBitableUrl(%s) is %s', (url, expected) => {
    expect(isFeishuBitableUrl(url)).toBe(expected);
  });

  it('recognizes Feishu and Lark hosts but rejects other hosts', () => {
    expect(feishuUrl(baseUrl)?.hostname).toBe('my.feishu.cn');
    expect(feishuUrl('https://acme.larksuite.com/base/appToken?table=tbl123')?.hostname).toBe('acme.larksuite.com');
    expect(feishuUrl('https://example.com/base/appToken?table=tbl123')).toBeUndefined();
    expect(feishuUrl('sales.csv')).toBeUndefined();

    expect(isFeishuHostUrl(baseUrl)).toBe(true);
    expect(isFeishuHostUrl('https://my.feishu.cn/wiki/wikcn123')).toBe(true);
    expect(isFeishuHostUrl('https://example.com/base/appToken?table=tbl123')).toBe(false);
  });
});

describe('Feishu credentials', () => {
  it('prefers explicit options over environment variables', async () => {
    vi.stubEnv('AVA_FEISHU_APP_ID', 'env-id');
    vi.stubEnv('AVA_FEISHU_APP_SECRET', 'env-secret');

    await expect(feishuCredentials({ appId: 'option-id', appSecret: 'option-secret' })).resolves.toEqual({
      appId: 'option-id',
      appSecret: 'option-secret',
    });
  });

  it('falls back to environment variables', async () => {
    vi.stubEnv('AVA_FEISHU_APP_ID', 'env-id');
    vi.stubEnv('AVA_FEISHU_APP_SECRET', 'env-secret');

    await expect(feishuCredentials({})).resolves.toEqual({ appId: 'env-id', appSecret: 'env-secret' });
  });

  it('rejects a half-configured pair before looking for saved credentials', async () => {
    await expect(feishuCredentials({ appId: 'option-id' })).rejects.toThrow(
      'Feishu Bitable source configuration requires both appId and appSecret'
    );
    await expect(feishuCredentials({ appSecret: 'option-secret' })).rejects.toThrow(
      'Feishu Bitable source configuration requires both appId and appSecret'
    );
  });

  it('reads ~/.ava/feishu.json when nothing else is configured', async () => {
    home = await mkdtemp(join(tmpdir(), 'ava-feishu-home-'));
    vi.stubEnv('HOME', home);
    await mkdir(join(home, '.ava'));
    await writeFile(join(home, '.ava', 'feishu.json'), JSON.stringify(credentials));

    await expect(feishuCredentials({})).resolves.toEqual(credentials);
  });

  it('reports invalid saved credentials JSON', async () => {
    home = await mkdtemp(join(tmpdir(), 'ava-feishu-home-'));
    vi.stubEnv('HOME', home);
    await mkdir(join(home, '.ava'));
    await writeFile(join(home, '.ava', 'feishu.json'), 'not json');

    await expect(feishuCredentials({})).rejects.toThrow('~/.ava/feishu.json is not valid JSON');
  });

  it('explains how to provide credentials when none are available', async () => {
    home = await mkdtemp(join(tmpdir(), 'ava-feishu-home-'));
    vi.stubEnv('HOME', home);

    await expect(feishuCredentials({})).rejects.toThrow(
      'Feishu Bitable source requires appId and appSecret. Provide them in the source config'
    );
  });
});
