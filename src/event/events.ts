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
  /** Operation identity, shared by its start and end events within one analysis. */
  id?: string;
  parentIds?: string[];

  constructor(
    type: AnalysisEventType,
    public data: object | null = {},
    operation?: { id: string; parentIds: string[] }
  ) {
    super(type);
    if (operation) {
      this.id = operation.id;
      this.parentIds = [...operation.parentIds];
    }
  }
}
