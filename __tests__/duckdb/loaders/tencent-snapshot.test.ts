import { describe, expect, it } from 'vitest';

import { convertRecord } from '../../../src/duckdb/loaders/tencent/convert';
import { createSnapshotBuilder } from '../../../src/duckdb/loaders/tencent/snapshot';

const fields = [{ field_id: 'f1', field_title: '文本"\n', field_type: 'text' }];
const record = (record_id: string) => ({
  record_id,
  field_values: [{ field: '文本"\n', text_value: { items: [{ text: '中文🙂"\n', type: 'text' }] } }],
});

describe('Tencent Docs expanded snapshot budgets', () => {
  it('counts exact UTF-8 JSON bytes, escaped keys/values, brackets and row commas', () => {
    const first = record('r1');
    const expected = convertRecord(fields, first);
    const exactBytes = Buffer.byteLength(JSON.stringify([expected]), 'utf8');
    const snapshot = createSnapshotBuilder(fields, { maxBytes: exactBytes, maxCells: 10 });
    snapshot.append(first);
    expect(snapshot.rows).toEqual([expected]);
    expect(() => snapshot.append(record('r2'))).toThrow('byte read limit');
    expect(snapshot.rows).toHaveLength(1);
  });

  it('rejects one byte over budget without retaining the rejected row', () => {
    const raw = record('r1');
    const bytes = Buffer.byteLength(JSON.stringify([convertRecord(fields, raw)]), 'utf8');
    const snapshot = createSnapshotBuilder(fields, { maxBytes: bytes - 1, maxCells: 10 });
    expect(() => snapshot.append(raw)).toThrow('byte read limit');
    expect(snapshot.rows).toEqual([]);
  });

  it('budgets omitted/null cells and record IDs before allocating the next dense row', () => {
    const snapshot = createSnapshotBuilder(fields, { maxBytes: 1024, maxCells: 2 });
    expect(snapshot.maxRecords).toBe(1);
    snapshot.append({ record_id: 'empty', field_values: [] });
    expect(snapshot.rows).toEqual([{ _record_id: 'empty', '文本"\n': null }]);
    // Even malformed input hits the cell limit before convertRecord is invoked.
    expect(() => snapshot.append(null)).toThrow('cell read limit');
    expect(snapshot.rows).toHaveLength(1);
  });

  it('caps a thousand-column sparse source before it can expand to 100 million properties', () => {
    const metadata = Array.from({ length: 1000 }, (_, i) => ({
      field_id: `f${i}`,
      field_title: `c${i}`,
      field_type: 'number',
    }));
    const snapshot = createSnapshotBuilder(metadata);
    expect(snapshot.maxRecords).toBe(999);
    expect(snapshot.rows).toEqual([]);
  });
});
