import type { LifecycleEventType, ExecutionEventType, AnalysisEventType, VisualizationEventType } from './constant';

export class BaseEvent {
  constructor(readonly type: string) {}
}

export class LifecycleEvent extends BaseEvent {
  constructor(type: LifecycleEventType, readonly data: object | null = {}) {
    super(type);
  }
}

export class ExecutionEvent extends BaseEvent {
  constructor(type: ExecutionEventType, readonly data: object | null = {}) {
    super(type);
  }
}

export class AnalysisEvent extends BaseEvent {
  constructor(type: AnalysisEventType, readonly data: object | null = {}) {
    super(type);
  }
}

export class VisualizationEvent extends BaseEvent {
  constructor(type: VisualizationEventType, readonly data: object | null = {}) {
    super(type);
  }
}
