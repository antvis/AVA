import { LifecycleEventType, ExecutionEventType, AnalysisEventType } from './constant';

export class BaseEvent {
  constructor(public type: string) {}
}

export class LifecycleEvent extends BaseEvent {
  constructor(
    type:
      | LifecycleEventType.CREATE_START
      | LifecycleEventType.CREATE_END
      | LifecycleEventType.DISPOSE_START
      | LifecycleEventType.DISPOSE_END,
    public data: object | null = {}
  ) {
    super(type);
  }
}

export class ExecutionEvent extends BaseEvent {
  constructor(
    type:
      | ExecutionEventType.LOAD_START
      | ExecutionEventType.LOAD_END
      | ExecutionEventType.PROFILE_START
      | ExecutionEventType.PROFILE_END
      | ExecutionEventType.ANALYZE_START
      | ExecutionEventType.ANALYZE_END
      | ExecutionEventType.VISUALIZE_START
      | ExecutionEventType.VISUALIZE_END
      | ExecutionEventType.SUGGEST_START
      | ExecutionEventType.SUGGEST_END,
    public data: object | null = {}
  ) {
    super(type);
  }
}

export class AnalysisEvent extends BaseEvent {
  constructor(
    type:
      | AnalysisEventType.TRANSLATE_START
      | AnalysisEventType.TRANSLATE_END
      | AnalysisEventType.QUERY_START
      | AnalysisEventType.QUERY_END
      | AnalysisEventType.SUMMARIZE_START
      | AnalysisEventType.SUMMARIZE_END
      | AnalysisEventType.SELECT_CONTEXT_START
      | AnalysisEventType.SELECT_CONTEXT_END
      | AnalysisEventType.REASON_START
      | AnalysisEventType.REASON_END,
    public data: object | null = {}
  ) {
    super(type);
  }
}
