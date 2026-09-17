/**
 * Unit tests for src/interpreter/loaders/index.ts
 */

import { describe, it, expect } from 'vitest';

import { loadSource } from '../../../src/interpreter/loaders';
import { getLLMConfig } from '../../test-utils';

describe('interpreter/loaders', () => {
  it('dispatches csv sources', async () => {
    const rows = await loadSource(
      { type: 'csv', options: { csv: 'a,b\n1,2' } },
      getLLMConfig(),
    );
    expect(rows).toEqual([{ a: 1, b: 2 }]);
  });

  it('dispatches json sources', async () => {
    const rows = await loadSource(
      { type: 'json', options: { data: [{ a: 1 }] } },
      getLLMConfig(),
    );
    expect(rows).toEqual([{ a: 1 }]);
  });

  it('rejects unsupported source types', async () => {
    await expect(
      loadSource({ type: 'mysql', options: {} } as any, getLLMConfig()),
    ).rejects.toThrow('Unsupported source type');
  });
});
