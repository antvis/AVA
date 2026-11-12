import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { AVA } from '../src';
import { downloadToTempFile, removeTempFile } from '../src/duckdb/util/file';
import { executionCode } from '../src/interpreter/python/util/code';
import { createPythonExecutor } from '../src/interpreter/python/util/execute';

import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { DataSourceConfig } from '../src/types';

const credentials = { 'X-API-Key': 'DUMMY-KEY', Authorization: 'Bearer DUMMY-TOKEN', Cookie: 'dummy=1' };
const requests: Array<{ server: number; path: string; headers: Record<string, unknown> }> = [];
const assets: Record<string, Buffer> = {};
const servers: Server[] = [];
const origins: string[] = [];
const statuses = [301, 302, 303, 307, 308];
const crossOriginError = 'Cross-origin redirects are not allowed for remote files with headers';
const executePython = createPythonExecutor(30_000);

function redirect(origin: string, target: string, status = 302): string {
  return `${origin}/redirect?${new URLSearchParams({ target, status: String(status) })}`;
}

beforeAll(async () => {
  assets['/data.csv'] = Buffer.from('value\n1\n');
  assets['/data.csv.gz'] = gzipSync(assets['/data.csv']);
  assets['/data.json'] = Buffer.from('[{"value":1}]');
  assets['/data.json.gz'] = gzipSync(assets['/data.json']);
  assets['/plain.csv.gz'] = assets['/data.csv'];
  assets['/delimited.csv'] = Buffer.from('value;label\n1;A\n');
  assets['/data.parquet'] = await readFile(join(__dirname, 'datasets/041_Airline.parquet'));
  assets['/data.xlsx'] = await readFile(join(__dirname, 'datasets/sales.xlsx'));
  for (const index of [0, 1]) {
    const server = createServer((req, res) => {
      const url = new URL(req.url!, 'http://localhost');
      requests.push({ server: index, path: url.pathname, headers: req.headers });
      if (url.pathname === '/redirect') {
        res.writeHead(Number(url.searchParams.get('status')), { Location: url.searchParams.get('target')! });
      } else if (url.pathname.startsWith('/chain/')) {
        const remaining = Number(url.pathname.split('/').pop());
        res.writeHead(302, { Location: remaining > 1 ? `/chain/${remaining - 1}` : '/data.csv' });
      } else if (url.pathname === '/loop') {
        res.writeHead(302, { Location: '/loop' });
      } else if (url.pathname === '/encoded') {
        res.writeHead(200, { 'Content-Encoding': 'gzip' });
        res.end(gzipSync(assets[url.searchParams.get('file') ?? '/data.csv']));
        return;
      } else if (assets[url.pathname]) {
        res.end(assets[url.pathname]);
        return;
      } else {
        res.writeHead(503);
      }
      res.end();
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    servers.push(server);
    origins.push(`http://127.0.0.1:${(server.address() as AddressInfo).port}`);
  }
});

beforeEach(() => {
  requests.length = 0;
});
afterEach(() => {
  vi.restoreAllMocks();
});
afterAll(async () => {
  await Promise.all(
    servers.map(
      (server) =>
        new Promise<void>((resolve, reject) => {
          server.close((error) => (error ? reject(error) : resolve()));
          server.closeAllConnections();
        })
    )
  );
});

const backends = [
  {
    name: 'DuckDB download',
    enabled: true,
    load: async (path: string, headers?: Record<string, string>) => {
      const file = await downloadToTempFile(path, 'csv', headers);
      try {
        expect(await readFile(file, 'utf8')).toBe('value\n1\n');
      } finally {
        await removeTempFile(file);
      }
    },
  },
  {
    name: 'Python download',
    enabled: process.env.AVA_PYTHON_LOCAL_TEST === '1',
    load: async (path: string, headers?: Record<string, string>) => {
      const result = await executePython(
        executionCode(
          'result = df',
          {
            type: 'csv-file',
            options: { path, headers },
          },
          { maxRows: 10, maxResultBytes: 1024 }
        ),
        2 * 1024 * 1024
      );
      expect(result.data).toEqual([{ value: 1 }]);
    },
  },
];

for (const { name, enabled, load } of backends) {
  describe.skipIf(!enabled)(name, () => {
    it('downloads directly with arbitrary credential headers', async () => {
      await load(origins[0] + '/data.csv', credentials);
      expect(requests).toHaveLength(1);
      expect(requests[0].headers).toMatchObject({ 'x-api-key': 'DUMMY-KEY', authorization: credentials.Authorization });
    });

    it.each(statuses)('preserves headers on same-origin relative %s redirects', async (status) => {
      await load(redirect(origins[0], '/data.csv', status), credentials);
      expect(requests).toHaveLength(2);
      expect(requests[1].headers).toMatchObject({
        'x-api-key': 'DUMMY-KEY',
        authorization: credentials.Authorization,
        cookie: 'dummy=1',
      });
      expect(credentials['X-API-Key']).toBe('DUMMY-KEY');
    });

    it.each(statuses)('rejects cross-origin %s before contacting its destination', async (status) => {
      await expect(load(redirect(origins[0], origins[1] + '/data.csv', status), credentials)).rejects.toThrow(
        crossOriginError
      );
      expect(requests.map((r) => r.server)).toEqual([0]);
    });

    it.each([{ Authorization: 'Bearer DUMMY' }, { Accept: 'text/csv' }])(
      'applies the same origin boundary to any nonempty headers: %j',
      async (headers) => {
        await expect(load(redirect(origins[0], origins[1] + '/data.csv'), headers)).rejects.toThrow(crossOriginError);
        expect(requests).toHaveLength(1);
      }
    );

    it.each(['scheme', 'host'])('rejects changes in %s before the next request', async (change) => {
      const target = origins[0].replace(
        change === 'scheme' ? 'http:' : '127.0.0.1',
        change === 'scheme' ? 'https:' : 'localhost'
      );
      await expect(load(redirect(origins[0], target + '/data.csv'), credentials)).rejects.toThrow(crossOriginError);
      expect(requests).toHaveLength(1);
    });

    it('stops an A-to-B-to-A chain at the first cross-origin hop', async () => {
      await expect(
        load(redirect(origins[0], redirect(origins[1], origins[0] + '/data.csv')), credentials)
      ).rejects.toThrow(crossOriginError);
      expect(requests.map((r) => r.server)).toEqual([0]);
    });

    it.each([undefined, {}])('retains anonymous cross-origin downloads with headers %j', async (headers) => {
      await load(redirect(origins[0], origins[1] + '/data.csv'), headers);
      expect(requests.map((r) => r.server)).toEqual([0, 1]);
      expect(requests[1].headers['x-api-key']).toBeUndefined();
    });

    it('allows 20 same-origin redirects and refuses the 21st', async () => {
      await load(origins[0] + '/chain/20', credentials);
      expect(requests).toHaveLength(21);
      requests.length = 0;
      await expect(load(origins[0] + '/chain/21', credentials)).rejects.toThrow('redirect limit exceeded');
      expect(requests).toHaveLength(21);
    }, 15_000);

    it('bounds repeated redirects and propagates HTTP errors', async () => {
      await expect(load(origins[0] + '/loop', credentials)).rejects.toThrow('redirect limit exceeded');
      expect(requests).toHaveLength(21);
      await expect(load(origins[0] + '/unavailable', credentials)).rejects.toThrow('503');
    }, 15_000);
  });
}

describe('download response cleanup', () => {
  it.each([new Headers({ 'X-API-Key': 'DUMMY-KEY' }), new Map([['X-API-Key', 'DUMMY-KEY']])])(
    'does not bypass the boundary for a fetch-compatible header container',
    async (headers) => {
      // JavaScript callers can supply these at runtime despite the narrower public type.
      await expect(
        downloadToTempFile(
          redirect(origins[0], origins[1] + '/data.csv'),
          'csv',
          headers as unknown as Record<string, string>
        )
      ).rejects.toThrow(crossOriginError);
      expect(requests.map((r) => r.server)).toEqual([0]);
    }
  );

  it('releases an HTTP error response without writing a temporary file', async () => {
    const response = new Response('unavailable', { status: 503, statusText: 'status-secret' });
    const cancel = vi.spyOn(response.body!, 'cancel');
    vi.spyOn(global, 'fetch').mockResolvedValue(response);
    const url = 'https://user:url-password@example.com/data.csv?signature=url-signature';
    await expect(downloadToTempFile(url, 'csv', credentials)).rejects.toEqual(
      new Error('Failed to fetch remote file (HTTP 503).')
    );
    expect(cancel).toHaveBeenCalledOnce();
  });

  it.each(['https://example.com/start', 'http://example.com/start'])(
    'releases the response before refusing an origin change from %s',
    async (url) => {
      const cancel = vi.fn().mockResolvedValue(undefined);
      const fetch = vi.spyOn(global, 'fetch').mockResolvedValue({
        status: 302,
        headers: new Headers({ location: 'http://other.example/data.csv' }),
        body: { cancel },
      } as unknown as Response);
      await expect(downloadToTempFile(url, 'csv', credentials)).rejects.toThrow(crossOriginError);
      expect(fetch).toHaveBeenCalledOnce();
      expect(cancel).toHaveBeenCalledOnce();
    }
  );

  it('releases an intermediate same-origin response before downloading the file', async () => {
    const intermediate = new Response('redirect', { status: 302, headers: { location: '/data.csv' } });
    const cancel = vi.spyOn(intermediate.body!, 'cancel');
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(intermediate).mockResolvedValueOnce(new Response('value\n1\n'));
    const file = await downloadToTempFile('https://example.com/start', 'csv', credentials);
    try {
      expect(cancel).toHaveBeenCalledOnce();
    } finally {
      await removeTempFile(file);
    }
  });
});

for (const type of ['duckdb', 'python'] as const) {
  describe.skipIf(type === 'python' && process.env.AVA_PYTHON_LOCAL_TEST !== '1')(`${type} public file sources`, () => {
    it.each([
      ['csv-file', 'csv'],
      ['json-file', 'json'],
      ['parquet', 'parquet'],
      ['excel', 'xlsx'],
    ] as const)(
      'protects %s and still loads valid same-origin data',
      async (format, extension) => {
        const ava = new AVA({
          llm: { model: 'unused' },
          engine: type === 'duckdb' ? { type, memoryLimit: '128MB', threads: 1 } : { type },
        });
        const options = { headers: credentials, path: redirect(origins[0], origins[1] + '/data.' + extension) };
        const source = { type: format, options } as DataSourceConfig;
        try {
          const load = async () => {
            await ava.source(source);
            await ava.schema();
          };
          await expect(load()).rejects.toThrow(crossOriginError);
          expect(requests.map((r) => r.server)).toEqual([0]);
          source.options = { ...options, path: redirect(origins[0], '/data.' + extension) };
          await ava.source(source);
          expect((await ava.schema()).models.length).toBeGreaterThan(0);
        } finally {
          await ava.dispose();
        }
      },
      30_000
    );
  });
}

describe.skipIf(process.env.AVA_PYTHON_LOCAL_TEST !== '1')('Python file compatibility', () => {
  it.each([
    ['csv-file', '/data.csv'],
    ['csv-file', '/encoded?file=/data.csv'],
    ['json-file', '/encoded?file=/data.json'],
    ['excel', '/encoded?file=/data.xlsx'],
    ['parquet', '/encoded?file=/data.parquet'],
  ] as const)('releases the downloaded %s buffer before executing analysis (%s)', async (type, path) => {
    const result = await executePython(
      executionCode(
        'import gc, io\nresult = sum(buffer.getbuffer().nbytes for buffer in gc.get_objects() if isinstance(buffer, io.BytesIO) and not buffer.closed)',
        { type, options: { path: origins[0] + path, headers: credentials } },
        { maxRows: 10, maxResultBytes: 1024 }
      ),
      2 * 1024 * 1024
    );
    expect(result.data).toEqual([{ value: 0 }]);
  });

  it('supports a custom executor using exec inside a Python function', async () => {
    const execute = (script: string) =>
      executePython(
        `import json\ndef run():\n    exec(json.loads(${JSON.stringify(JSON.stringify(script))}))\nrun()`,
        2 * 1024 * 1024
      );
    const ava = new AVA({ llm: { model: 'unused' }, engine: { type: 'python', execute } });
    try {
      await ava.source({
        type: 'csv-file',
        options: {
          path: redirect(origins[0], '/data.csv'),
          headers: credentials,
        },
      });
      expect((await ava.query('result = df')).data).toEqual([{ value: 1 }]);
    } finally {
      await ava.dispose();
    }
  });

  it.each([
    ['json-file', 'json', 1],
    ['excel', 'xlsx', 240],
    ['parquet', 'parquet', 5],
  ] as const)('decodes HTTP gzip before parsing %s', async (type, extension, rows) => {
    const result = await executePython(
      executionCode(
        'result = len(next(iter(tables.values())))',
        {
          type,
          options: { path: origins[0] + '/encoded?file=/data.' + extension, headers: credentials },
        },
        { maxRows: 10, maxResultBytes: 1024 }
      ),
      2 * 1024 * 1024
    );
    expect(result.data).toEqual([{ value: rows }]);
  });

  it('preserves selected Excel sheets and ranges for protected downloads', async () => {
    const result = await executePython(
      executionCode(
        "result = tables['Sales']",
        {
          type: 'excel',
          options: {
            path: origins[0] + '/data.xlsx',
            headers: credentials,
            sheets: [{ sheet: 'Sales', range: 'A1:B3' }],
          },
        },
        { maxRows: 10, maxResultBytes: 1024 }
      ),
      2 * 1024 * 1024
    );
    expect(result.data).toHaveLength(2);
    expect(result.schema.map((field) => field.name)).toEqual(['order_id', 'order_date']);
  });

  it('preserves CSV reader options and an explicit compression override', async () => {
    for (const [file, options, expected] of [
      ['/delimited.csv', { delim: ';' }, [{ value: 1, label: 'A' }]],
      ['/plain.csv.gz', { compression: 'none' }, [{ value: 1 }]],
    ] as const) {
      const result = await executePython(
        executionCode(
          'result = df',
          {
            type: 'csv-file',
            options: { path: origins[0] + file, headers: credentials, options },
          },
          { maxRows: 10, maxResultBytes: 1024 }
        ),
        2 * 1024 * 1024
      );
      expect(result.data).toEqual(expected);
    }
  });

  it.each(['csv-file', 'json-file'] as const)('preserves inferred compression for protected %s URLs', async (type) => {
    const extension = type === 'csv-file' ? 'csv' : 'json';
    const result = await executePython(
      executionCode(
        'result = df',
        {
          type,
          options: { path: origins[0] + '/data.' + extension + '.gz', headers: credentials },
        },
        { maxRows: 10, maxResultBytes: 1024 }
      ),
      2 * 1024 * 1024
    );
    expect(result.data).toEqual([{ value: 1 }]);
  });

  it('preserves HTTP gzip encoding and downloads in the custom executor on each query', async () => {
    const execute = vi.fn((script: string) => executePython(script, 2 * 1024 * 1024));
    const ava = new AVA({ llm: { model: 'unused' }, engine: { type: 'python', execute } });
    try {
      await ava.source({ type: 'csv-file', options: { path: origins[0] + '/encoded', headers: credentials } });
      expect(requests).toHaveLength(0);
      for (let repeat = 0; repeat < 2; repeat++) {
        expect((await ava.query('result = df')).data).toEqual([{ value: 1 }]);
      }
      expect(requests).toHaveLength(2);
      expect(execute).toHaveBeenCalledTimes(4); // compile + execution for each query
    } finally {
      await ava.dispose();
    }
  });
});
