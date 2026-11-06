import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { readNotionTable } from '../../../src/duckdb/loaders/notion/read';

const mock = vi.hoisted(() => ({
  retrieveDatabase: vi.fn(),
  queryDatabase: vi.fn(),
}));
vi.mock('../../../src/duckdb/loaders/notion/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/duckdb/loaders/notion/client')>();
  return {
    ...actual,
    NotionClient: class {
      retrieveDatabase = mock.retrieveDatabase;
      queryDatabase = mock.queryDatabase;
    },
  };
});

const properties = {
  Amount: { id: 'amount', name: 'Amount', type: 'number', number: { format: 'number' } },
  Region: { id: 'region', name: 'Region', type: 'select', select: { options: [] } },
};
const page = (id: string, amount: number) => ({
  id,
  object: 'page',
  properties: {
    Amount: { id: 'amount', type: 'number', number: amount },
    Region: { id: 'region', type: 'select', select: { name: 'East' } },
  },
});
const options = { databaseId: 'db123', token: 'test-secret' };

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv('NOTION_TOKEN', undefined);
  mock.retrieveDatabase.mockResolvedValue({ properties });
  mock.queryDatabase.mockResolvedValue({ object: 'list', results: [page('r1', 42)], has_more: false, next_cursor: null });
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe('Notion read orchestration', () => {
  it('reads the schema, queries pages and rechecks metadata', async () => {
    expect(await readNotionTable(options)).toEqual({
      fields: [
        { id: 'amount', name: 'Amount', type: 'number', sqlType: 'DOUBLE' },
        { id: 'region', name: 'Region', type: 'select', sqlType: 'VARCHAR' },
      ],
      rows: [{ _id: 'r1', Amount: 42, Region: 'East' }],
    });
    expect(mock.retrieveDatabase).toHaveBeenCalledTimes(2);
    expect(mock.queryDatabase).toHaveBeenCalledWith('db123', { page_size: 100 });
  });

  it('resolves the token from NOTION_TOKEN, while an explicit token takes precedence', async () => {
    vi.stubEnv('NOTION_TOKEN', 'env-token');
    await readNotionTable({ databaseId: 'db' });
    expect(mock.retrieveDatabase).toHaveBeenCalledWith('db');
    await readNotionTable(options);
  });

  it.each([
    { databaseId: 'db' },
    { ...options, token: 'line\nbreak' },
    { ...options, pageSize: 101 },
    { ...options, pageSize: 0 },
    { ...options, maxRecords: 0 },
    { ...options, maxRetries: 6 },
    { ...options, timeoutMs: Infinity },
    { ...options, databaseId: '' },
  ])('validates credentials and bounds before connecting', async (config) => {
    await expect(readNotionTable(config)).rejects.toThrow();
    expect(mock.retrieveDatabase).not.toHaveBeenCalled();
  });

  it('rejects metadata changes between the first and last schema read', async () => {
    mock.retrieveDatabase
      .mockResolvedValueOnce({ properties })
      .mockResolvedValueOnce({
        properties: { Amount: { id: 'amount', name: 'Renamed', type: 'number', number: { format: 'number' } } },
      });
    await expect(readNotionTable(options)).rejects.toThrow('metadata changed');
  });

  it('clears the deadline even when loading fails', async () => {
    vi.useFakeTimers();
    mock.retrieveDatabase.mockRejectedValue(new Error('authentication failed'));
    await expect(readNotionTable(options)).rejects.toThrow('authentication failed');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('honors a custom page size in the query body', async () => {
    await readNotionTable({ ...options, pageSize: 2 });
    expect(mock.queryDatabase).toHaveBeenCalledWith('db123', { page_size: 2 });
  });
});