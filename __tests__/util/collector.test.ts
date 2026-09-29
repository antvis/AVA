import EventEmitter from '@antv/event-emitter';
import { expect, it } from 'vitest';

import {
  LifecycleEvent,
  LifecycleEventType,
  ExecutionEvent,
  ExecutionEventType,
  AnalysisEvent,
  AnalysisEventType,
  EventCollector,
} from '../../src/util/event';

function fakeDelay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

it('collects events from all three phases', () => {
  const emitter = new EventEmitter();
  const collector = new EventCollector();
  collector.attach(emitter);

  emitter.emit(
    LifecycleEventType.CREATE_START,
    new LifecycleEvent(LifecycleEventType.CREATE_START)
  );
  emitter.emit(
    ExecutionEventType.LOAD_START,
    new ExecutionEvent(ExecutionEventType.LOAD_START, { type: 'csv' })
  );
  emitter.emit(
    AnalysisEventType.QUERY_START,
    new AnalysisEvent(AnalysisEventType.QUERY_START, { dsl: 'SELECT 1' })
  );

  const trail = collector.trail();
  expect(trail).toHaveLength(3);
  expect(trail[0].phase).toBe('lifecycle');
  expect(trail[1].phase).toBe('execution');
  expect(trail[2].phase).toBe('analysis');
});

it('assigns sequential seq numbers', () => {
  const emitter = new EventEmitter();
  const collector = new EventCollector();
  collector.attach(emitter);

  emitter.emit(AnalysisEventType.QUERY_START, new AnalysisEvent(AnalysisEventType.QUERY_START));
  emitter.emit(AnalysisEventType.QUERY_END, new AnalysisEvent(AnalysisEventType.QUERY_END));

  const trail = collector.trail();
  expect(trail[0].seq).toBe(0);
  expect(trail[1].seq).toBe(1);
});

it('captures timestamps and delta between events', async () => {
  const emitter = new EventEmitter();
  const collector = new EventCollector();
  collector.attach(emitter);

  emitter.emit(AnalysisEventType.QUERY_START, new AnalysisEvent(AnalysisEventType.QUERY_START));
  await fakeDelay(10);
  emitter.emit(AnalysisEventType.QUERY_END, new AnalysisEvent(AnalysisEventType.QUERY_END, { data: [] }));

  const trail = collector.trail();
  expect(trail[0].delta).toBe(0);
  expect(trail[0].timestamp).toBeLessThanOrEqual(trail[1].timestamp);
  expect(trail[1].delta).toBeGreaterThanOrEqual(5);
});

it('flags error events correctly', () => {
  const emitter = new EventEmitter();
  const collector = new EventCollector();
  collector.attach(emitter);

  emitter.emit(
    AnalysisEventType.QUERY_END,
    new AnalysisEvent(AnalysisEventType.QUERY_END, { error: { message: 'syntax error' } })
  );
  emitter.emit(
    AnalysisEventType.QUERY_END,
    new AnalysisEvent(AnalysisEventType.QUERY_END, { data: [{ count: 1 }] })
  );

  const trail = collector.trail();
  expect(trail[0].isError).toBe(true);
  expect(trail[1].isError).toBe(false);
});

it('filter returns only records for the given phase', () => {
  const emitter = new EventEmitter();
  const collector = new EventCollector();
  collector.attach(emitter);

  emitter.emit(LifecycleEventType.CREATE_END, new LifecycleEvent(LifecycleEventType.CREATE_END));
  emitter.emit(ExecutionEventType.ANALYZE_START, new ExecutionEvent(ExecutionEventType.ANALYZE_START));
  emitter.emit(ExecutionEventType.ANALYZE_END, new ExecutionEvent(ExecutionEventType.ANALYZE_END));
  emitter.emit(AnalysisEventType.TRANSLATE_START, new AnalysisEvent(AnalysisEventType.TRANSLATE_START));

  expect(collector.filter('lifecycle')).toHaveLength(1);
  expect(collector.filter('execution')).toHaveLength(2);
  expect(collector.filter('analysis')).toHaveLength(1);
});

it('errors() returns only error records', () => {
  const emitter = new EventEmitter();
  const collector = new EventCollector();
  collector.attach(emitter);

  emitter.emit(
    AnalysisEventType.QUERY_END,
    new AnalysisEvent(AnalysisEventType.QUERY_END, { error: { message: 'fail' } })
  );
  emitter.emit(ExecutionEventType.ANALYZE_END, new ExecutionEvent(ExecutionEventType.ANALYZE_END));
  emitter.emit(
    AnalysisEventType.SUMMARIZE_END,
    new AnalysisEvent(AnalysisEventType.SUMMARIZE_END, { error: { message: 'timeout' } })
  );

  expect(collector.errors()).toHaveLength(2);
});

it('clear() resets records while keeping the listener active', () => {
  const emitter = new EventEmitter();
  const collector = new EventCollector();
  collector.attach(emitter);

  emitter.emit(AnalysisEventType.QUERY_START, new AnalysisEvent(AnalysisEventType.QUERY_START));
  expect(collector.trail()).toHaveLength(1);

  collector.clear();
  expect(collector.trail()).toHaveLength(0);

  emitter.emit(AnalysisEventType.QUERY_END, new AnalysisEvent(AnalysisEventType.QUERY_END));
  expect(collector.trail()).toHaveLength(1);
  expect(collector.trail()[0].seq).toBe(0);
});

it('toJSON() produces valid JSON with all records', () => {
  const emitter = new EventEmitter();
  const collector = new EventCollector();
  collector.attach(emitter);

  emitter.emit(
    AnalysisEventType.QUERY_START,
    new AnalysisEvent(AnalysisEventType.QUERY_START, { dsl: 'SELECT 1' })
  );

  const json = collector.toJSON();
  const parsed = JSON.parse(json);
  expect(parsed).toBeInstanceOf(Array);
  expect(parsed[0].type).toBe('querystart');
  expect(parsed[0].data).toEqual({ dsl: 'SELECT 1' });
});

it('detach() stops collecting', () => {
  const emitter = new EventEmitter();
  const collector = new EventCollector();
  collector.attach(emitter);

  emitter.emit(AnalysisEventType.QUERY_START, new AnalysisEvent(AnalysisEventType.QUERY_START));
  expect(collector.trail()).toHaveLength(1);

  collector.detach();

  emitter.emit(AnalysisEventType.QUERY_END, new AnalysisEvent(AnalysisEventType.QUERY_END));
  expect(collector.trail()).toHaveLength(1);
});

it('trail is a readonly snapshot', () => {
  const emitter = new EventEmitter();
  const collector = new EventCollector();
  collector.attach(emitter);

  emitter.emit(AnalysisEventType.QUERY_START, new AnalysisEvent(AnalysisEventType.QUERY_START));

  const trail = collector.trail();
  expect(Object.isFrozen(trail)).toBe(false); // readonly type, not frozen at runtime
  expect(trail.length).toBe(1);
});
