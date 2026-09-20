import { describe, expect, it } from 'vitest';

import { run } from '../src/cli';

describe('CLI', () => {
  it('prints help without credentials', async () => {
    const output: string[] = [];

    await run([], {}, (value) => output.push(value));

    expect(output[0]).toContain('ava analyze <source> <question>');
  });

  it('requires a non-empty question', async () => {
    for (const question of [[], [''], [' \t ']]) {
      await expect(run(['analyze', 'data/companies.csv', ...question], {})).rejects.toThrow(
        'A non-empty question is required.',
      );
    }
  });
});
