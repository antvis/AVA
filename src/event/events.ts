import { LifecycleEventType, AnalysisEventType } from './constant';

import type { AnalysisEventContext } from './types';

export class BaseEvent {
  constructor(public type: string) {}
}

export class LifecycleEvent extends BaseEvent {
  constructor(type: LifecycleEventType, public data: object | null = {}) {
    super(type);
  }
}

export class AnalysisEvent extends BaseEvent {
  context?: AnalysisEventContext;

  constructor(type: AnalysisEventType, public data: object | null = {}, context?: AnalysisEventContext) {
    super(type);

    if (context) {
      this.context = { ...context };
      if (context.parentStepIds) this.context.parentStepIds = [...context.parentStepIds];
    }
  }
}
