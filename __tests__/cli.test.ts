import { mkdtemp, readFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  config: undefined as unknown,
  source: undefined as unknown,
  query: undefined as string | undefined,
  visualized: undefined as unknown,
  analysis: { query: 'Total revenue', text: 'Revenue is 3.', data: [{ total: 3 }] },
  visualization: {
    chartType: 'column',
    syntax: '{ type: "interval" }',
    html: '<!doctype html><title>Chart</title>',
  } as { chartType: string; syntax: string; html: string } | null,
  visualizeCalls: 0,
  disposeCalls: 0,
  failure: undefined as 'load' | 'analysis' | 'visualize' | undefined,
}));

vi.mock('../src/index', () => ({
  AVA: class {
    constructor(config: unknown) {
      state.config = config;
    }

    async load(source: unknown) {
      state.source = source;
      if (state.failure === 'load') throw new Error('Load failed.');
    }

    async analysis(query: string) {
      state.query = query;
      if (state.failure === 'analysis') throw new Error('Analysis failed.');
      return state.analysis;
    }

    async visualize(analysis: unknown) {
      state.visualizeCalls += 1;
      state.visualized = analysis;
      if (state.failure === 'visualize') throw new Error('Visualization failed.');
      return state.visualization;
    }

    async dispose() {
      state.disposeCalls += 1;
    }
  },
}));

import { run } from '../src/cli';
import { accent, badge, bold, formatError, inferSource, muted } from '../src/cli/util';

const ENV = { OPENAI_API_KEY: 'test-key' };

beforeEach(() => {
  state.config = undefined;
  state.source = undefined;
  state.query = undefined;
  state.visualized = undefined;
  state.analysis = { query: 'Total revenue', text: 'Revenue is 3.', data: [{ total: 3 }] };
  state.visualization = {
    chartType: 'column',
    syntax: '{ type: "interval" }',
    html: '<!doctype html><title>Chart</title>',
  };
  state.visualizeCalls = 0;
  state.disposeCalls = 0;
  state.failure = undefined;
});

describe('help and validation', () => {
  it('prints root help without requiring credentials', async () => {
    for (const argv of [[], ['--help'], ['-h']]) {
      const output: string[] = [];
      await run(argv, {}, (value) => output.push(value));

      expect(output).toHaveLength(1);
      expect(output[0]).toContain('✦  AVA   Talk to your data');
      expect(output[0]).toContain('Usage:\n  ava <command> [options]');
      expect(output[0]).toContain('Commands:');
    }
  });

  it('prints analyze help without requiring credentials', async () => {
    for (const argv of [
      ['analyze', '--help'],
      ['analyze', '-h'],
    ]) {
      const output: string[] = [];
      await run(argv, {}, (value) => output.push(value));

      expect(output).toHaveLength(1);
      expect(output[0]).toContain('Usage:\n  ava analyze <source> <question> [options]');
      expect(output[0]).toContain('Arguments:');
      expect(output[0]).toContain('Options:');
      expect(output[0]).toContain('Environment:');
      expect(output[0]).toContain('Examples:');
    }
  });

  it('reports unknown commands and missing sources', async () => {
    await expect(run(['unknown'], {})).rejects.toThrow('Unknown command "unknown".');
    await expect(run(['analyze'], {})).rejects.toThrow('Missing required argument: <source>.');
  });

  it('requires a non-empty question', async () => {
    for (const question of [[], [''], [' \t ']]) {
      await expect(run(['analyze', 'data.csv', ...question], {})).rejects.toThrow('A non-empty question is required.');
    }
  });

  it('requires --chart when --output is used', async () => {
    for (const output of [
      ['--output', 'chart.html'],
      ['-o', 'chart.html'],
    ]) {
      await expect(run(['analyze', 'data.csv', 'summarize', ...output], {})).rejects.toThrow(
        '--output requires --chart.'
      );
    }
  });

  it('requires an API key before creating AVA', async () => {
    await expect(run(['analyze', 'data.csv', 'summarize'], {})).rejects.toThrow('Set OPENAI_API_KEY.');
    expect(state.config).toBeUndefined();
  });
});

describe('source inference', () => {
  it.each([
    ['data.csv', 'csv-file'],
    ['data.JSON', 'json-file'],
    ['data.parquet', 'parquet'],
    ['data.xlsx', 'excel'],
  ])('infers %s as %s', (source, type) => {
    expect(inferSource(source)).toEqual({ type, options: { path: source } });
  });

  it('accepts an explicit supported type', () => {
    expect(inferSource('data', 'parquet')).toEqual({
      type: 'parquet',
      options: { path: 'data' },
    });
  });

  it('infers a remote file source', () => {
    const source = 'https://example.com/data.csv';
    expect(inferSource(source)).toEqual({ type: 'csv-file', options: { path: source } });
  });

  it('rejects unknown inferred and explicit types', () => {
    expect(() => inferSource('data.txt')).toThrow('Cannot infer the source type');
    expect(() => inferSource('data.csv', 'text')).toThrow('Cannot infer the source type');
  });
});

describe('analysis workflow', () => {
  it('passes model, source, and complete question to AVA', async () => {
    const output: string[] = [];
    await run(
      ['analyze', 'data.csv', 'total', 'revenue'],
      {
        OPENAI_API_KEY: 'key',
        OPENAI_MODEL: 'model',
        OPENAI_BASE_URL: 'https://example.com/v1',
      },
      (value) => output.push(value)
    );

    expect(state.config).toEqual({
      llm: { apiKey: 'key', model: 'model', baseURL: 'https://example.com/v1' },
    });
    expect(state.source).toEqual({ type: 'csv-file', options: { path: 'data.csv' } });
    expect(state.query).toBe('total revenue');
    expect(state.visualizeCalls).toBe(0);
    expect(JSON.parse(output[0])).toEqual({ analysis: state.analysis });
    expect(state.disposeCalls).toBe(1);
  });

  it('uses the default model and omits an unset base URL', async () => {
    await run(['analyze', 'data.csv', 'summarize'], ENV, () => {});

    expect(state.config).toEqual({ llm: { apiKey: 'test-key', model: 'gpt-4o-mini' } });
  });

  it.each([
    ['load', ['analyze', 'data.csv', 'summarize'], 'Load failed.'],
    ['analysis', ['analyze', 'data.csv', 'summarize'], 'Analysis failed.'],
    ['visualize', ['analyze', 'data.csv', 'summarize', '--chart'], 'Visualization failed.'],
  ] as const)('disposes AVA when %s fails', async (failure, argv, message) => {
    state.failure = failure;

    await expect(run([...argv], ENV, () => {})).rejects.toThrow(message);
    expect(state.disposeCalls).toBe(1);
  });
});

describe('chart output', () => {
  it('returns visualization data when --chart is used', async () => {
    const output: string[] = [];
    await run(['analyze', 'data.csv', 'chart revenue', '--chart'], ENV, (value) => output.push(value));

    expect(state.visualizeCalls).toBe(1);
    expect(state.visualized).toBe(state.analysis);
    expect(JSON.parse(output[0])).toEqual({
      analysis: state.analysis,
      visualization: state.visualization,
    });
  });

  it('creates chart HTML without overwriting an existing file', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'ava-cli-test-'));
    const output = join(directory, 'chart.html');
    const argv = ['analyze', 'data.csv', 'chart revenue', '-c', '-o', output];

    try {
      await run(argv, ENV, () => {});
      expect(await readFile(output, 'utf8')).toBe(state.visualization?.html);

      await expect(run(argv, ENV, () => {})).rejects.toMatchObject({ code: 'EEXIST' });
      expect(await readFile(output, 'utf8')).toBe(state.visualization?.html);
      expect(state.disposeCalls).toBe(2);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('does not create a file when no visualization is produced', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'ava-cli-test-'));
    const output = join(directory, 'chart.html');
    state.visualization = null;

    try {
      const stdout: string[] = [];
      await run(['analyze', 'data.csv', 'chart revenue', '--chart', '--output', output], ENV, (value) =>
        stdout.push(value)
      );

      await expect(readFile(output)).rejects.toMatchObject({ code: 'ENOENT' });
      expect(JSON.parse(stdout[0])).toEqual({ analysis: state.analysis, visualization: null });
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
