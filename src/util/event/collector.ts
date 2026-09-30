/**
 * Event collector — subscribes to all AVA events via the EventEmitter's
 * wildcard channel and builds a timestamped, ordered trail of everything
 * that happened during a session.
 */
import { LifecycleEvent, ExecutionEvent, AnalysisEvent } from './events';

import type EventEmitter from '@antv/event-emitter';
import type { BaseEvent } from './events';

/** Phase an event belongs to. */
export type EventPhase = 'lifecycle' | 'execution' | 'analysis';

/** A single record in the analysis trail. */
export interface AnalysisRecord {
  /** Sequential index, starting at 0. */
  seq: number;
  /** Event type string (e.g. 'querystart', 'analyzestart'). */
  type: string;
  /** Phase the event belongs to. */
  phase: EventPhase;
  /** Milliseconds since the Unix epoch. */
  timestamp: number;
  /** Milliseconds since the previous record (0 for the first). */
  delta: number;
  /** Event payload — the `data` object carried by the event. */
  data: object | null;
  /** True when the event represents an error path. */
  isError: boolean;
}

function phaseOf(event: BaseEvent): EventPhase {
  if (event instanceof LifecycleEvent) return 'lifecycle';
  if (event instanceof ExecutionEvent) return 'execution';
  if (event instanceof AnalysisEvent) return 'analysis';
  return 'analysis';
}

function isErrorData(data: object | null): boolean {
  return !!data && typeof data === 'object' && 'error' in data && data.error != null;
}

/**
 * Collects every event emitted by an AVA instance into an ordered,
 * timestamped analysis trail.
 */
export class EventCollector {
  private records: AnalysisRecord[] = [];
  private seq = 0;
  private lastTime = 0;
  private emitter: EventEmitter | null = null;
  private listener: ((event: BaseEvent) => void) | null = null;

  /**
   * Bind to an EventEmitter (typically an AVA instance) and start collecting.
   * Uses the `'*'` wildcard channel so every named event is captured.
   */
  attach(emitter: EventEmitter): this {
    this.detach();

    this.emitter = emitter;
    this.listener = (event: BaseEvent) => {
      const now = Date.now();
      const data = (event as { data?: object | null }).data ?? null;
      this.records.push({
        seq: this.seq++,
        type: event.type,
        phase: phaseOf(event),
        timestamp: now,
        delta: this.lastTime === 0 ? 0 : now - this.lastTime,
        data,
        isError: isErrorData(data),
      });
      this.lastTime = now;
    };

    emitter.on('*', this.listener);
    return this;
  }

  /** Remove the wildcard listener so no further events are collected. */
  detach(): this {
    if (this.listener && this.emitter) {
      this.emitter.off('*', this.listener);
    }
    this.listener = null;
    this.emitter = null;
    return this;
  }

  /** Read-only access to the full analysis trail. */
  trail(): readonly AnalysisRecord[] {
    return this.records;
  }

  /** Filter the trail by phase. */
  filter(phase: EventPhase): AnalysisRecord[] {
    return this.records.filter((r) => r.phase === phase);
  }

  /** Return records flagged as errors. */
  errors(): AnalysisRecord[] {
    return this.records.filter((r) => r.isError);
  }

  /** Clear all collected records (keeps the listener active). */
  clear(): this {
    this.records = [];
    this.seq = 0;
    this.lastTime = 0;
    return this;
  }

  /** Serialize the trail to a JSON string. */
  toJSON(): string {
    return JSON.stringify(this.records, null, 2);
  }
}
