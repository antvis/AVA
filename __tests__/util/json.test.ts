import { describe, expect, it } from 'vitest';

import { repairJson } from '../../src/util/json';

describe('repairJson', () => {
  it.each([
    ['{value: 1,}', { value: 1 }],
    ["```json\n[{'value': 1},]\n```", [{ value: 1 }]],
    ['true', true],
  ])('repairs JSON independently of a summary schema: %s', (text, value) => {
    expect(JSON.parse(repairJson(text as string))).toEqual(value);
  });

  it('preserves unrepairable input for the caller', () => {
    const text = '{"value": 1} trailing text';
    expect(repairJson(text)).toBe(text);
  });
});
