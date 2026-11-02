import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

import { describe, expect, it } from 'vitest';

const exec = promisify(execFile);
const credentials = {
  TENCENT_DOCS_CLIENT_ID: 'test-client',
  TENCENT_DOCS_OPEN_ID: 'test-open',
  TENCENT_DOCS_ACCESS_TOKEN: 'test-token',
  TENCENT_DOCS_ENCODED_FILE_ID: 'encoded/?',
  TENCENT_DOCS_SHEET_ID: 'sheet',
};

describe('Tencent Docs separate native-ID conversion command', () => {
  it.each(['success', 'exists', 'business-error', 'http-error', 'oversized', 'malformed'])(
    'converts only the explicit ID, with restricted exclusive output: %s',
    async (mode) => {
      const directory = await mkdtemp(join(tmpdir(), 'ava-tencent-converter-'));
      try {
        const preload = join(directory, 'preload.mjs');
        const output = join(directory, 'source.json');
        await writeFile(
          preload,
          `
        import assert from 'node:assert/strict';
        globalThis.fetch = async (url, init) => {
          assert.equal(url.origin, 'https://docs.qq.com');
          assert.equal(url.pathname, '/openapi/drive/v2/util/converter');
          assert.equal(url.searchParams.get('value'), 'encoded/?');
          assert.equal(url.searchParams.get('type'), '2');
          assert.equal(init.redirect, 'error');
          assert.equal(init.method, undefined);
          assert.equal(init.headers['Access-Token'], 'test-token');
          assert.equal(init.headers['Client-Id'], 'test-client');
          assert.equal(init.headers['Open-Id'], 'test-open');
          assert.ok(init.signal instanceof AbortSignal);
          if (${JSON.stringify(mode)} === 'oversized') return new Response('x'.repeat(8193));
          if (${JSON.stringify(mode)} === 'malformed') return new Response('private invalid body');
          return Response.json({ ret: ${
            mode === 'business-error' ? 10313 : 0
          }, data: { fileID: 'native-file' } }, { status: ${mode === 'http-error' ? 403 : 200} });
        };
      `
        );
        if (mode === 'exists') await writeFile(output, 'existing-private-config');
        const command = exec(
          process.execPath,
          ['--import', pathToFileURL(preload).href, resolve('examples/tencent-docs/convert-id.mjs'), output],
          { env: { ...process.env, ...credentials }, timeout: 10000 }
        );
        if (mode === 'success') {
          const { stdout } = await command;
          expect(stdout).toContain('PASS');
          for (const value of Object.values(credentials)) expect(stdout).not.toContain(value);
          expect(stdout).not.toContain('native-file');
          expect(JSON.parse(await readFile(output, 'utf8'))).toEqual({
            type: 'tencent-smartsheet',
            options: { fileId: 'native-file', sheetId: 'sheet' },
          });
          if (process.platform !== 'win32') expect((await stat(output)).mode & 0o777).toBe(0o600);
        } else {
          const error = await command.catch((error) => error);
          expect(error.code).toBe(1);
          expect(error.stderr).toContain('Conversion failed');
          expect(error.stderr).not.toContain('private invalid body');
          for (const value of Object.values(credentials)) expect(error.stderr).not.toContain(value);
          if (mode === 'exists') expect(await readFile(output, 'utf8')).toBe('existing-private-config');
          else await expect(stat(output)).rejects.toMatchObject({ code: 'ENOENT' });
        }
      } finally {
        await rm(directory, { recursive: true, force: true });
      }
    }
  );
});
