import { DataStore } from '@ava/data/model/plain/DataStore';

describe('DataStore', () => {
  const data = [
    ['2332332ade3', '2000-09-08', 10, 2],
    ['1234332ade3', '2000-09-08', 20, 22],
    ['dfl2332ade3', '2000-09-08', 40, 1],
    ['128j3jn4844', '2000-09-08', 10, 3],
    ['1303044k599', '2000-09-08', 60, 7],
  ];

  const ds = new DataStore({
    data,
    columns: ['id', 'date', '单价', '数量'],
  });

  test('constructor', () => {
    expect(ds.data).toEqual(data);
    expect(ds.columns).toEqual(['id', 'date', '单价', '数量']);
    expect(ds.columnIndexMap.get('id')).toBe(0);
    expect(ds.columnIndexMap.get('数量')).toBe(3);
  });

  test('getColumnData', () => {
    expect(ds.getColumnData('id')).toEqual(['2332332ade3', '1234332ade3', 'dfl2332ade3', '128j3jn4844', '1303044k599']);
  });

  test('getRowData', () => {
    expect(ds.getRowData(2)).toEqual(data[2]);
  });

  test('computeColumnFeature & getColumnFeature', async () => {
    await ds.computeColumnFeature('id');
    expect(ds.getColumnFeature('id')).toEqual({
      count: 5,
      distinct: 5,
      types: ['string'],
      recommendation: 'string',
      missing: 0,
      rawData: ['2332332ade3', '1234332ade3', 'dfl2332ade3', '128j3jn4844', '1303044k599'],
      valueMap: {
        '2332332ade3': 1,
        '1234332ade3': 1,
        dfl2332ade3: 1,
        '128j3jn4844': 1,
        '1303044k599': 1,
      },
      maxLength: 11,
      minLength: 11,
      meanLength: 11,
      containsChar: true,
      containsDigit: true,
      containsSpace: false,
      levelOfMeasurements: ['Nominal'],
    });
    expect(ds.getColumnFeature('数量')).toBe(undefined);
  });
});
