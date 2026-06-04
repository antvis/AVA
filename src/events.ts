type Handler = (...args: any[]) => void;

export class EventEmitter {
  private _events: Map<string, Set<Handler>> = new Map();

  on(event: string, handler: Handler): this {
    if (!this._events.has(event)) {
      this._events.set(event, new Set());
    }
    this._events.get(event)!.add(handler);
    return this;
  }

  off(event: string, handler: Handler): this {
    const handlers = this._events.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this._events.delete(event);
      }
    }
    return this;
  }

  emit(event: string, ...args: any[]): this {
    this._events.get(event)?.forEach((handler) => handler(...args));
    return this;
  }

  removeAllListeners(event?: string): this {
    if (event) {
      this._events.delete(event);
    } else {
      this._events.clear();
    }
    return this;
  }
}
