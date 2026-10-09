import { mkdtemp, readFile, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join, resolve } from 'path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AVA } from '../src/ava';
import { run } from '../src/cli';
import { createSession, request } from '../src/cli/session/client';
import { accent, badge, bold, formatError, muted } from '../src/cli/util';

vi.mock('../src/cli/session/client', () => ({ createSession: vi.fn(), request: vi.fn() }));
vi.mock('../src/ava', () => ({
  AVA: vi.fn(function () {
    return { recommend: vi.fn(), visualize: vi.fn(), viz: vi.fn() };
  }),
}));

const commands = [
  'source',
  'schema',
  'profile',
  'suggest',
  'analyze',
  'translate',
  'query',
  'visualize',
  'recommend',
  'viz',
  'dispose',
];
const datasetId = 'ds_sales_012345abcdef';
const ttyDescriptor = Object.getOwnPropertyDescriptor(process.stdout, 'isTTY');

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv('OPENAI_API_KEY', undefined);
  vi.stubEnv('OPENAI_MODEL', undefined);
  vi.stubEnv('OPENAI_BASE_URL', undefined);
  Object.defineProperty(process.stdout, 'isTTY', { configurable: true, value: false });
  vi.mocked(createSession).mockResolvedValue({ datasetId });
  vi.mocked(request).mockResolvedValue({ ok: true });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  if (ttyDescriptor) Object.defineProperty(process.stdout, 'isTTY', ttyDescriptor);
  else Reflect.deleteProperty(process.stdout, 'isTTY');
});

async function execute(argv: string[]): Promise<string> {
  const write = vi.fn();
  await run(argv, write);
  expect(write).toHaveBeenCalledOnce();
  return write.mock.calls[0][0];
}

describe('help and validation', () => {
  it('prints root help with the current commands', async () => {
    for (const argv of [[], ['--help'], ['-h']]) {
      const output = await execute(argv);
      expect(output).toContain('ava <command> [options]');
      for (const command of commands) expect(output).toMatch(new RegExp(`\\n  ${command} +`));
    }
  });

  it.each(commands)('prints %s help without executing the command', async (command) => {
    expect(await execute([command, '--help'])).toContain(`ava ${command}`);
    expect(createSession).not.toHaveBeenCalled();
    expect(request).not.toHaveBeenCalled();
    expect(AVA).not.toHaveBeenCalled();
  });

  it('rejects unknown commands, unsupported options and invalid positionals', async () => {
    await expect(run(['unknown'])).rejects.toThrow('Unknown command "unknown".');
    await expect(run(['--chart'])).rejects.toThrow('Unknown option');
    await expect(run(['schema', datasetId, '--output', 'out.json'])).rejects.toThrow('Unknown option');
    for (const argv of [
      ['source'],
      ['schema', datasetId, 'extra'],
      ['analyze', datasetId],
      ['translate', datasetId, ' '],
    ]) {
      await expect(run(argv)).rejects.toThrow('Invalid arguments');
    }
    expect(request).not.toHaveBeenCalled();
    expect(createSession).not.toHaveBeenCalled();
  });
});

describe('source', () => {
  it.each([
    ['sales.CSV', [], 'csv-file', resolve('sales.CSV')],
    ['https://example.com/sales.parquet?download=1', [], 'parquet', 'https://example.com/sales.parquet?download=1'],
    ['sales.data', ['-t', 'json-file'], 'json-file', resolve('sales.data')],
  ])('loads %s and returns the dataset ID as JSON', async (path, options, type, expectedPath) => {
    expect(JSON.parse(await execute(['source', path, ...options]))).toEqual({ datasetId });
    expect(createSession).toHaveBeenCalledExactlyOnceWith(
      { type, options: { path: expectedPath } },
      { model: 'gpt-4o-mini' },
      undefined
    );
  });

  it('loads a source config file and rejects a conflicting type override', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'ava-cli-test-'));
    try {
      const file = join(directory, 'source.json');
      const config = { type: 'json', options: { data: [{ sales: 10 }] } };
      await writeFile(file, JSON.stringify(config));
      await execute(['source', `@${file}`]);
      expect(createSession).toHaveBeenCalledExactlyOnceWith(config, { model: 'gpt-4o-mini' }, undefined);
      await expect(run(['source', `@${file}`, '--type', 'json-file'])).rejects.toThrow(
        '--type cannot be combined with a source config.'
      );
      expect(createSession).toHaveBeenCalledOnce();
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it.each(['duckdb', 'python', 'javascript', 'supabase', 'clickhouse'])(
    'passes an explicit %s engine with a source config',
    async (engine) => {
      const directory = await mkdtemp(join(tmpdir(), 'ava-cli-test-'));
      try {
        const file = join(directory, 'source.json');
        const config = { type: 'json', options: { data: [{ sales: 10 }] } };
        await writeFile(file, JSON.stringify(config));
        await execute(['source', `@${file}`, '--engine', engine]);
        expect(createSession).toHaveBeenCalledExactlyOnceWith(config, { model: 'gpt-4o-mini' }, engine);
      } finally {
        await rm(directory, { recursive: true, force: true });
      }
    }
  );

  it('selects Python for a file without changing its source type', async () => {
    await execute(['source', 'sales.csv', '--engine', 'python']);
    expect(createSession).toHaveBeenCalledExactlyOnceWith(
      { type: 'csv-file', options: { path: resolve('sales.csv') } },
      { model: 'gpt-4o-mini' },
      'python'
    );
  });

  it.each(['invalid', '', '{"type":"python","execute":"custom"}'])(
    'rejects invalid engine %s before creating a session',
    async (engine) => {
      await expect(run(['source', 'sales.csv', '--engine', engine])).rejects.toThrow('Invalid enum value');
      expect(createSession).not.toHaveBeenCalled();
    }
  );

  it('shows the dataset ID and next command in a terminal', async () => {
    Object.defineProperty(process.stdout, 'isTTY', { configurable: true, value: true });
    const output = await execute(['source', 'sales.csv']);
    expect(output).toContain(datasetId);
    expect(output).toContain(`ava schema ${datasetId}`);
  });
});

describe('dataset commands', () => {
  it.each([
    { args: ['schema'], message: { command: 'schema' } },
    { args: ['dispose'], message: { command: 'dispose' } },
    { args: ['profile'], message: { command: 'profile', metrics: undefined } },
    {
      args: ['profile', '--metrics', 'row_count, mean'],
      message: { command: 'profile', metrics: ['row_count', 'mean'] },
    },
    { args: ['profile', '--metrics', ''], message: { command: 'profile', metrics: [] } },
    { args: ['suggest'], message: { command: 'suggest', count: 3 } },
    { args: ['suggest', '--count', '5'], message: { command: 'suggest', count: 5 } },
    { args: ['translate', 'Total sales?'], message: { command: 'translate', query: 'Total sales?' } },
    {
      args: ['analyze', 'Total sales?', '--strategy', 'loop', '--max-rows', '10', '--max-result-bytes', '1024'],
      message: { command: 'analyze', query: 'Total sales?', strategy: 'loop', maxRows: 10, maxResultBytes: 1024 },
    },
    {
      args: ['query', '--dsl', 'SELECT 1', '--max-rows', '10', '--max-result-bytes', '1024'],
      message: { command: 'query', dsl: 'SELECT 1', maxRows: 10, maxResultBytes: 1024 },
    },
    {
      args: ['query', '--dsl', "result = df.groupby('region', as_index=False)['sales'].sum()"],
      message: {
        command: 'query',
        dsl: "result = df.groupby('region', as_index=False)['sales'].sum()",
        maxRows: undefined,
        maxResultBytes: undefined,
      },
    },
  ])('dispatches $args as a typed request and prints JSON', async ({ args: [command, ...args], message }) => {
    expect(JSON.parse(await execute([command, datasetId, ...args]))).toEqual({ ok: true });
    expect(request).toHaveBeenCalledExactlyOnceWith(datasetId, message);
  });

  it.each([
    { args: ['query'], error: 'A non-empty --dsl is required.' },
    { args: ['query', '--dsl', ' '], error: 'A non-empty --dsl is required.' },
    { args: ['query', '--dsl', 'SELECT 1', '--max-rows', '10001'], error: '--max-rows must be an integer' },
    { args: ['query', '--dsl', 'result = 1', '--engine', 'python'], error: 'Unknown option' },
    { args: ['suggest', '--count', '0'], error: '--count must be an integer' },
    { args: ['profile', '--metrics', 'mean,'], error: '--metrics contains an empty item.' },
    { args: ['analyze', 'Total sales?', '--strategy', 'invalid'], error: 'Invalid enum value' },
  ])('rejects invalid $args before sending a request', async ({ args: [command, ...args], error }) => {
    await expect(run([command, datasetId, ...args])).rejects.toThrow(error);
    expect(request).not.toHaveBeenCalled();
  });

  it('propagates session errors without writing a success result', async () => {
    vi.mocked(request).mockRejectedValueOnce(new Error('Dataset unavailable.'));
    const write = vi.fn();
    await expect(run(['schema', datasetId], write)).rejects.toThrow('Dataset unavailable.');
    expect(write).not.toHaveBeenCalled();
  });
});

describe('chart commands', () => {
  const data = [{ city: 'Hangzhou', sales: 10 }];
  const spec = { chartType: 'column' as const, syntax: 'vis column\ndata\n  - Hangzhou 10' };
  const html = '<!DOCTYPE html><html>chart</html>';

  it.each(['recommend', 'visualize'] as const)(
    'passes query, data and current model settings to %s',
    async (command) => {
      vi.stubEnv('OPENAI_API_KEY', 'test-key');
      vi.stubEnv('OPENAI_MODEL', 'test-model');
      vi.stubEnv('OPENAI_BASE_URL', 'https://example.com/v1');
      const method = vi.fn().mockResolvedValue(command === 'recommend' ? spec : { ...spec, html });
      vi.mocked(AVA).mockImplementationOnce(function () {
        return { [command]: method } as unknown as AVA;
      });
      const output = await execute([command, '--query', 'Show sales', '--data', JSON.stringify(data)]);
      expect(JSON.parse(output)).toEqual(command === 'recommend' ? spec : { ...spec, html });
      expect(method).toHaveBeenCalledExactlyOnceWith({ query: 'Show sales', data });
      expect(AVA).toHaveBeenCalledExactlyOnceWith({
        llm: { apiKey: 'test-key', model: 'test-model', baseURL: 'https://example.com/v1' },
      });
    }
  );

  it('requires an API key for AI chart commands', async () => {
    for (const command of ['recommend', 'visualize']) {
      await expect(run([command, '--query', 'Show sales', '--data', JSON.stringify(data)])).rejects.toThrow(
        'Set OPENAI_API_KEY for this command.'
      );
    }
    expect(AVA).not.toHaveBeenCalled();
  });

  it('renders a spec without an API key and never overwrites an existing output file', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'ava-cli-test-'));
    const viz = vi.fn().mockResolvedValue(html);
    vi.mocked(AVA).mockImplementation(function () {
      return { viz } as unknown as AVA;
    });
    try {
      const output = join(directory, 'chart.html');
      const args = ['viz', '--spec', JSON.stringify(spec), '-o', output];
      expect(JSON.parse(await execute(args))).toEqual({ output });
      expect(viz).toHaveBeenCalledExactlyOnceWith(spec);
      expect(await readFile(output, 'utf8')).toBe(html);
      await expect(run(args)).rejects.toThrow('EEXIST');
      expect(await readFile(output, 'utf8')).toBe(html);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});

describe('terminal formatting', () => {
  it('keeps styles plain outside a colored terminal', () => {
    expect(accent('Usage:', false)).toBe('Usage:');
    expect(bold('AVA', false)).toBe('AVA');
    expect(muted('Description', false)).toBe('Description');
    expect(badge('AVA', false)).toBe(' AVA ');
  });

  it('applies styles in a colored terminal', () => {
    expect(accent('Usage:', true)).toBe('\u001B[1;36mUsage:\u001B[0m');
    expect(bold('AVA', true)).toBe('\u001B[1mAVA\u001B[0m');
    expect(muted('Description', true)).toBe('\u001B[2mDescription\u001B[0m');
    expect(badge('AVA', true)).toBe('\u001B[1;30;46m AVA \u001B[0m');
  });

  it('formats Error instances and unknown errors', () => {
    expect(formatError(new Error('Failed.'), false)).toBe('Error: Failed.');
    expect(formatError('Failed.', true)).toBe('\u001B[1;31mError:\u001B[0m Failed.');
  });
});
