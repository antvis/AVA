/**
 * Tests for the Tedious connector's event handling. The optional driver is
 * absent in this repository, so a fake module reproduces the event stream
 * (columnMetadata -> row* -> request callback) and connection-level errors.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

const fake = vi.hoisted(() => {
  type Handler = (arg?: any) => void;

  class FakeRequest {
    handlers: Record<string, Handler[]> = {};

    constructor(
      public sql: string,
      public callback: (error?: Error, rowCount?: number) => void
    ) {}

    on(event: string, handler: Handler): FakeRequest {
      (this.handlers[event] ??= []).push(handler);
      return this;
    }

    emit(event: string, arg?: any): void {
      for (const handler of this.handlers[event] ?? []) handler(arg);
    }

    complete(error?: Error): void {
      this.callback(error);
    }
  }

  class FakeConnection {
    closed = false;
    listeners: Record<string, Handler[]> = {};
    requests: FakeRequest[] = [];

    constructor(public config: unknown) {
      state.connection = this;
      state.configs.push(config);
    }

    connect(callback: (error?: Error) => void): void {
      Promise.resolve().then(() => {
        const error = state.connectError;
        if (error) this.emit('error', error);
        callback(error);
      });
    }

    execSql(request: FakeRequest): void {
      this.requests.push(request);
    }

    close(): void {
      this.closed = true;
      this.emit('end');
    }

    on(event: string, handler: Handler): FakeConnection {
      (this.listeners[event] ??= []).push(handler);
      return this;
    }

    emit(event: string, arg?: any): void {
      for (const handler of this.listeners[event] ?? []) handler(arg);
    }
  }

  const state: { connection: FakeConnection | null; configs: unknown[]; connectError?: Error } = {
    connection: null,
    configs: [],
  };
  return { state, FakeConnection, FakeRequest };
});

vi.mock('../../../src/remote/sqlserver/tedious-loader', () => ({
  loadTedious: async () => ({ Connection: fake.FakeConnection, Request: fake.FakeRequest }),
}));

import { TediousQueryConnector } from '../../../src/remote/sqlserver/tedious';

const OPTIONS = { server: 'localhost', database: 'demo', user: 'sa', password: 'secret' };

async function nextRequest(connection: InstanceType<typeof fake.FakeConnection>) {
  for (let i = 0; i < 20; i += 1) {
    if (connection.requests.length > 0) return connection.requests[0];
    await Promise.resolve();
  }
  throw new Error('query request was never issued');
}

afterEach(() => {
  fake.state.connection = null;
  fake.state.configs = [];
  fake.state.connectError = undefined;
});

describe('TediousQueryConnector', () => {
  it('decodes array rows using column metadata aliases', async () => {
    const connector = new TediousQueryConnector(OPTIONS);
    await connector.connect();
    const connection = fake.state.connection!;

    const pending = connector.query('SELECT Region, Units FROM orders');
    const request = await nextRequest(connection);

    request.emit('columnMetadata', [
      { colName: 'Region', type: { name: 'nvarchar' } },
      { colName: 'Units', type: { name: 'int' } },
    ]);
    request.emit('row', [{ value: 'North' }, { value: 12 }]);
    request.complete();

    await expect(pending).resolves.toEqual({
      columns: [
        { name: 'Region', type: 'nvarchar' },
        { name: 'Units', type: 'int' },
      ],
      rows: [{ Region: 'North', Units: 12 }],
    });

    await connector.close();
  });

  it('keeps duplicate aliases and generated-name collisions distinct', async () => {
    const connector = new TediousQueryConnector(OPTIONS);
    await connector.connect();
    const connection = fake.state.connection!;

    const pending = connector.query('SELECT 1 AS amount, 2 AS amount, 3 AS amount_2');
    const request = await nextRequest(connection);
    request.emit('columnMetadata', [
      { colName: 'amount', type: { name: 'int' } },
      { colName: 'amount', type: { name: 'int' } },
      { colName: 'amount_2', type: { name: 'int' } },
    ]);
    request.emit('row', [{ value: 1 }, { value: 2 }, { value: 3 }]);
    request.complete();

    await expect(pending).resolves.toEqual({
      columns: [
        { name: 'amount', type: 'int' },
        { name: 'amount_2', type: 'int' },
        { name: 'amount_2_2', type: 'int' },
      ],
      rows: [{ amount: 1, amount_2: 2, amount_2_2: 3 }],
    });

    await connector.close();
  });

  it('rejects connection establishment when an early connection error is emitted', async () => {
    fake.state.connectError = new Error('dial failed');
    const connector = new TediousQueryConnector(OPTIONS);

    await expect(connector.connect()).rejects.toThrow('dial failed');
    await connector.close();
  });

  it('rejects the in-flight call when the connection emits an error', async () => {
    const connector = new TediousQueryConnector(OPTIONS);
    await connector.connect();
    const connection = fake.state.connection!;

    const pending = connector.query('SELECT 1');
    await nextRequest(connection);
    const rejected = expect(pending).rejects.toThrow('socket closed');

    connection.emit('error', new Error('socket closed'));
    await rejected;

    // The failed connection is discarded, so the next call reconnects.
    await connector.connect();
    expect(fake.state.connection).not.toBe(connection);
    await connector.close();
  });

  it('passes failures from the request callback through', async () => {
    const connector = new TediousQueryConnector(OPTIONS);
    await connector.connect();
    const connection = fake.state.connection!;

    const pending = connector.query('SELECT 1');
    const request = await nextRequest(connection);
    const rejected = expect(pending).rejects.toThrow('bad SQL');
    request.complete(new Error('bad SQL'));
    await rejected;

    await connector.close();
  });
});
