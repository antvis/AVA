import { expect, it } from 'vitest';

import { serializeError } from '../../src/util/error';

it('serializes errors and non-Error thrown values', () => {
  expect(serializeError(new TypeError('Invalid query'))).toEqual({ name: 'TypeError', message: 'Invalid query' });
  expect(serializeError('Query failed')).toEqual({ message: 'Query failed' });
  expect(serializeError(null)).toEqual({ message: 'null' });
  expect(serializeError(undefined)).toEqual({ message: 'undefined' });
});
