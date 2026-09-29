export enum ExecutionEventType {
  QUERY_START = 'querystart',
  QUERY_END = 'queryend',
}

export class BaseEvent {
  constructor(readonly type: string) {}
}

export class OperationEvent extends BaseEvent {
  constructor(
    type: ExecutionEventType.QUERY_START | ExecutionEventType.QUERY_END,
    readonly data: object = {}
  ) {
    super(type);
  }
}
