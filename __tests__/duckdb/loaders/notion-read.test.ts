import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { readNotionTable } from '../../../src/duckdb/loaders/notion/read';

const mock = vi.hoisted(() => ({
  retrieveDatabase: vi.fn(),
  queryDatabase: vi.fn(),
  retrievePropertyItem: vi.fn(),
}));
vi.mock('../../../src/duckdb/loaders/notion/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/duckdb/loaders/notion/client')>();
  return {
    ...actual,
    NotionClient: class {
      retrieveDatabase = mock.retrieveDatabase;
      queryDatabase = mock.queryDatabase;
      retrievePropertyItem = mock.retrievePropertyItem;
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
  mock.queryDatabase.mockResolvedValue({
    object: 'list',
    results: [page('r1', 42)],
    has_more: false,
    next_cursor: null,
  });
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
    { ...options, version: '2025-09-03' },
    { ...options, timeoutMs: Infinity },
    { ...options, databaseId: '' },
  ])('validates credentials and bounds before connecting', async (config) => {
    await expect(readNotionTable(config)).rejects.toThrow();
    expect(mock.retrieveDatabase).not.toHaveBeenCalled();
  });

  it('rejects metadata changes between the first and last schema read', async () => {
    mock.retrieveDatabase.mockResolvedValueOnce({ properties }).mockResolvedValueOnce({
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

  it('uses the complete formula property item and infers a numeric column', async () => {
    const formulaProperties = {
      Formula: { id: 'formula', name: 'Formula', type: 'formula', formula: { expression: '1 + 1' } },
    };
    mock.retrieveDatabase.mockResolvedValue({ properties: formulaProperties });
    mock.queryDatabase.mockResolvedValue({
      object: 'list',
      results: [
        {
          id: 'r1',
          properties: { Formula: { id: 'formula', type: 'formula', formula: { type: 'number', number: 1 } } },
        },
      ],
      has_more: false,
      next_cursor: null,
    });
    mock.retrievePropertyItem.mockResolvedValue({
      object: 'property_item',
      id: 'formula',
      type: 'formula',
      formula: { type: 'number', number: 8 },
    });
    const result = await readNotionTable(options);
    expect(result.rows).toEqual([{ _id: 'r1', Formula: 8 }]);
    expect(result.fields[0]).toMatchObject({ resultType: 'number', sqlType: 'DOUBLE' });
    expect(mock.retrievePropertyItem).toHaveBeenCalledWith('r1', 'formula', undefined);
  });

  it('reads every people property-item page instead of accepting a truncated page array', async () => {
    const peopleProperties = { Owners: { id: 'owners', name: 'Owners', type: 'people', people: {} } };
    const people = Array.from({ length: 25 }, (_, index) => ({ object: 'user', id: `user-${index}` }));
    mock.retrieveDatabase.mockResolvedValue({ properties: peopleProperties });
    mock.queryDatabase.mockResolvedValue({
      object: 'list',
      results: [{ id: 'r1', properties: { Owners: { id: 'owners', type: 'people', people } } }],
      has_more: false,
      next_cursor: null,
    });
    const item = (user: unknown) => ({ object: 'property_item', id: 'owners', type: 'people', people: user });
    mock.retrievePropertyItem
      .mockResolvedValueOnce({
        object: 'list',
        type: 'property_item',
        results: people.map(item),
        has_more: true,
        next_cursor: 'people-cursor',
        property_item: { id: 'owners', type: 'people', people: {}, next_url: 'next' },
      })
      .mockResolvedValueOnce({
        object: 'list',
        type: 'property_item',
        results: [item({ object: 'user', id: 'user-25' })],
        has_more: false,
        next_cursor: null,
        property_item: { id: 'owners', type: 'people', people: {}, next_url: null },
      });
    const result = await readNotionTable(options);
    expect(result.rows[0].Owners).toHaveLength(26);
    expect(result.rows[0].Owners).toContain('user-25');
    expect(result.fields[0].sqlType).toBe('VARCHAR[]');
    expect(mock.retrievePropertyItem.mock.calls.map((call) => call[2])).toEqual([undefined, 'people-cursor']);
  });

  it('uses a rollup result only after its final property-item page', async () => {
    const rollupProperties = {
      Total: { id: 'roll', name: 'Total', type: 'rollup', rollup: { function: 'sum' } },
    };
    mock.retrieveDatabase.mockResolvedValue({ properties: rollupProperties });
    mock.queryDatabase.mockResolvedValue({
      object: 'list',
      results: [
        {
          id: 'r1',
          properties: {
            Total: { id: 'roll', type: 'rollup', rollup: { type: 'number', number: 1, function: 'sum' } },
          },
        },
      ],
      has_more: false,
      next_cursor: null,
    });
    const relation = { object: 'property_item', id: 'rel', type: 'relation', relation: { id: 'related' } };
    mock.retrievePropertyItem
      .mockResolvedValueOnce({
        object: 'list',
        type: 'property_item',
        results: [relation],
        has_more: true,
        next_cursor: 'roll-cursor',
        property_item: {
          id: 'roll',
          type: 'rollup',
          next_url: 'next',
          rollup: { type: 'incomplete', incomplete: {}, function: 'sum' },
        },
      })
      .mockResolvedValueOnce({
        object: 'list',
        type: 'property_item',
        results: [relation],
        has_more: false,
        next_cursor: null,
        property_item: {
          id: 'roll',
          type: 'rollup',
          next_url: null,
          rollup: { type: 'number', number: 8, function: 'sum' },
        },
      });
    const result = await readNotionTable(options);
    expect(result.rows).toEqual([{ _id: 'r1', Total: 8 }]);
    expect(result.fields[0]).toMatchObject({ resultType: 'number', sqlType: 'DOUBLE' });
    expect(mock.retrievePropertyItem).toHaveBeenCalledTimes(2);
  });

  it('honors a custom page size in the query body', async () => {
    await readNotionTable({ ...options, pageSize: 2 });
    expect(mock.queryDatabase).toHaveBeenCalledWith('db123', { page_size: 2 });
  });
});
