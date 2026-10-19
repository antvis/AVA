import { expect, it } from 'vitest';

import { deserializeError, serializeError } from '../../src/util/error';

it('serializes errors and non-Error thrown values', () => {
  expect(serializeError(new TypeError('Invalid query'))).toEqual({ name: 'TypeError', message: 'Invalid query' });
  expect(serializeError('Query failed')).toEqual({ message: 'Query failed' });
  expect(serializeError(null)).toEqual({ message: 'null' });
  expect(serializeError(undefined)).toEqual({ message: 'undefined' });
});

it('preserves safe error classification metadata through serialization', () => {
  const error = Object.assign(new Error('Unauthorized'), { category: 'authentication', status: 401 });
  const serialized = serializeError(error);

  expect(serialized).toEqual({
    name: 'Error',
    message: 'Unauthorized',
    category: 'authentication',
    status: 401,
  });
  expect(deserializeError(serialized)).toMatchObject({
    name: 'Error',
    message: 'Unauthorized',
    category: 'authentication',
    status: 401,
  });
});
