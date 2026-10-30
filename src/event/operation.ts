import EventEmitter from '@antv/event-emitter';

/** An awaitable operation with events scoped to this invocation. */
export type Operation<T> = Promise<T> & { readonly events: EventEmitter };

export function withOperationEvents<T>(run: (events: EventEmitter) => Promise<T>): Operation<T> {
  const events = new EventEmitter();
  const promise = Promise.resolve().then(() => run(events)) as Operation<T>;
  Object.defineProperty(promise, 'events', { value: events });
  return promise;
}

/** Reject an invalid engine operation instead of silently losing its events. */
export function eventsOf(operation: Operation<unknown>): EventEmitter {
  if (!operation?.events || typeof operation.events.on !== 'function') {
    void Promise.resolve(operation).catch(() => {});
    throw new Error('Engine operations must return an Operation with an events channel');
  }
  return operation.events;
}
