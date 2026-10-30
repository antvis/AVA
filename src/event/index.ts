import type EventEmitter from '@antv/event-emitter';
import type { BaseEvent } from './events';

export * from './constant';
export * from './events';
export * from './operation';
export * from './types';

export function startOf(pairId: string) {
  return `${pairId}:start`;
}

export function endOf(pairId: string) {
  return `${pairId}:end`;
}

/**
 * Trigger event based on Event object
 */
export function emit(emitter: EventEmitter, event: BaseEvent) {
  emitter.emit(event.type, event);
}
