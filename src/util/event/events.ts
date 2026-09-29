export enum ExecutionEventType {
  ANALYZE_START = 'analyzestart',
  ANALYZE_END = 'analyzeend',
  TRANSLATE_START = 'translatestart',
  TRANSLATE_END = 'translateend',
  QUERY_START = 'querystart',
  QUERY_END = 'queryend',
}

export class BaseEvent {
  constructor(readonly type: string) {}
}

export class OperationEvent extends BaseEvent {
  constructor(type: ExecutionEventType, readonly data: object = {}) {
    super(type);
  }
}
