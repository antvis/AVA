import { LifecycleEventType, AnalysisEventType } from './constant';

export class BaseEvent {
  constructor(public type: string) {}
}

export class LifecycleEvent extends BaseEvent {
  constructor(type: LifecycleEventType, public data: object | null = {}) {
    super(type);
  }
}

export class AnalysisEvent extends BaseEvent {
  constructor(type: AnalysisEventType, public data: object | null = {}) {
    super(type);
  }
}
