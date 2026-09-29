import type EventEmitter from '@antv/event-emitter';
import type { BaseEvent } from './events';

export { ExecutionEventType, BaseEvent, OperationEvent } from './events';

/**
 * Trigger event based on Event object
 */
export function emit(emitter: EventEmitter, event: BaseEvent) {
  emitter.emit(event.type, event);
}
