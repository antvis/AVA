import { generateId } from 'ai';

import type EventEmitter from '@antv/event-emitter';
import type { BaseEvent } from './events';
import type { AnalysisEventType } from './constant';

export * from './constant';
export * from './events';
export * from './types';

export function startOf(pairId: string) {
  return `${pairId}:start`;
}

export function endOf(pairId: string) {
  return `${pairId}:end`;
}

export function eventPair(
  emitEvent: (type: AnalysisEventType, data: object, eventId: string) => void,
  startType: AnalysisEventType,
  endType: AnalysisEventType
) {
  const pairId = generateId();

  return {
    pairId,
    endId: endOf(pairId),
    start: (data: object) => emitEvent(startType, data, startOf(pairId)),
    end: (data: object) => emitEvent(endType, data, endOf(pairId)),
  };
}

/**
 * Trigger event based on Event object
 */
export function emit(emitter: EventEmitter, event: BaseEvent) {
  emitter.emit(event.type, event);
}
