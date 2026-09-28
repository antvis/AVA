import { describe, expect, it } from 'vitest';

import { run } from '../src/cli';
import { accent, badge, bold, formatError, muted } from '../src/cli/util';

describe('help and validation', () => {
  it('prints root help', async () => {
    for (const argv of [[], ['--help'], ['-h']]) {
      const output: string[] = [];
      await run(argv, (value) => output.push(value));
      expect(output).toHaveLength(1);
      expect(output[0]).toContain('Usage:\n  ava [--help]');
      expect(output[0]).toContain('No commands are currently available.');
      expect(output[0]).not.toContain('analyze');
    }
  });

  it('rejects removed commands and options', async () => {
    await expect(run(['analyze', 'data.csv', 'summarize'])).rejects.toThrow('Unknown command "analyze".');
    await expect(run(['analyze', '--help'])).rejects.toThrow('Unknown command "analyze".');
    await expect(run(['unknown'])).rejects.toThrow('Unknown command "unknown".');
    for (const option of ['--chart', '--output', '--type']) {
      await expect(run([option])).rejects.toThrow('Unknown option');
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
