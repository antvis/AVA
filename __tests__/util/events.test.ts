import EventEmitter from '@antv/event-emitter';
import { expect, it, vi } from 'vitest';

import { ExecutionEventType, OperationEvent, emit } from '../../src/util/event';

it('dispatches type and data to named and wildcard listeners', () => {
  const emitter = new EventEmitter();
  const listener = vi.fn();
  const collector = vi.fn();
  emitter.on(ExecutionEventType.QUERY_START, listener);
  emitter.on('*', collector);

  const event = new OperationEvent(ExecutionEventType.QUERY_START, { dsl: 'SELECT 1' });
  emit(emitter, event);

  expect(listener).toHaveBeenCalledExactlyOnceWith(event);
  expect(collector).toHaveBeenCalledExactlyOnceWith(event);
  expect(JSON.parse(JSON.stringify(event))).toEqual({
    type: 'querystart',
    data: { dsl: 'SELECT 1' },
  });
  emitter.off(ExecutionEventType.QUERY_START, listener);
  emit(emitter, event);
  expect(listener).toHaveBeenCalledOnce();
});

it('propagates synchronous listener errors unchanged', () => {
  const emitter = new EventEmitter();
  const error = new Error('Cannot collect');
  emitter.on(ExecutionEventType.QUERY_START, () => {
    throw error;
  });
  expect(() => emit(emitter, new OperationEvent(ExecutionEventType.QUERY_START))).toThrow(error);
});
