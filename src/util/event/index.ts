import type EventEmitter from '@antv/event-emitter';
import type { BaseEvent } from './events';

export * from './constant';
export * from './events';

/**
 * Trigger event based on Event object
 */
export function emit(emitter: EventEmitter, event: BaseEvent) {
  emitter.emit(event.type, event);
}
