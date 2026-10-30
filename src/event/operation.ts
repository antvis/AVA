import EventEmitter from '@antv/event-emitter';

const operationEvents = Symbol('operationEvents');

type Operation<T> = Promise<T> & { [operationEvents]: EventEmitter };

/** Create a promise with events scoped to this invocation. */
export function withOperationEvents<T>(run: (events: EventEmitter) => Promise<T>): Promise<T> {
  const events = new EventEmitter();
  const promise = Promise.resolve().then(() => run(events)) as Operation<T>;
  Object.defineProperty(promise, operationEvents, { value: events });
  return promise;
}

export function eventsOf(promise: Promise<unknown>): EventEmitter | undefined {
  return (promise as Partial<Operation<unknown>>)[operationEvents];
}
