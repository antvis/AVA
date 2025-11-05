import { DataStore } from '@ava/extract/model/DataStore';

describe('DataStore', () => {
  const data = [
    ['2332332ade3', '2000-09-08', 10, 2],
    ['1234332ade3', '2000-09-09', 20, 22],
    ['dfl2332ade3', '2000-09-10', 40, 1],
    ['128j3jn4844', '2000-09-11', 10, 3],
    ['1303044k599', '2000-09-12', 60, 7],
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
    const featureForId = await ds.getColumnFeature('id');
    expect(featureForId).toEqual({
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
  });

  const ds2 = new DataStore({
    data: [
      ['a', 'Hello World', 2234, '0908'],
      ['b', 'The Pig', 2311, '0909'],
      ['c', 'Tony', 112, '0910'],
      ['a', '233A', 1123, '0908'],
      ['b', 'The Cat', 1565, '0909'],
      ['c', 'Lucy', 234, '0910'],
      ['a', 'Lucky', 2345, '0908'],
      ['b', 'Dog', 1234, '0909'],
      ['c', 'Nice', 345, '0910'],
    ],
    columns: ['category', 'name', 'value', 'date'],
  });

  test('getSample by string', async () => {
    const sampleData1 = await ds2.getSample('category', 1 / 3);
    expect(sampleData1.length).toBe(3);
    const sampleData2 = await ds2.getSample('category', 2 / 3);
    expect(sampleData2.length).toBe(6);
  });

  test('getSample by number', async () => {
    const sampleData1 = await ds2.getSample('value', 1 / 3);
    expect(sampleData1.length).toBeGreaterThanOrEqual(2);
    expect(sampleData1.length).toBeLessThanOrEqual(4);
    const sampleData2 = await ds2.getSample('value', 2 / 3);
    expect(sampleData2.length).toBeGreaterThanOrEqual(5);
    expect(sampleData2.length).toBeLessThanOrEqual(7);
  });

  // todo: test sample by date column

  // todo: test sample with more data

  // todo: should ref to some paper
  test('getAssociationScore', async () => {
    const score1 = await ds2.getAssociationScore('category', 'value');
    expect(score1).toBeGreaterThanOrEqual(0.5);
    expect(score1).toBeLessThanOrEqual(1);

    const score2 = await ds2.getAssociationScore('category', 'date');
    expect(score2).toBeLessThanOrEqual(0.5);

    // name and value is strongly associated
    const score3 = await ds2.getAssociationScore('name', 'value');
    expect(score3).toBe(1);

    // name and date is not associated
    const score4 = await ds2.getAssociationScore('name', 'date');
    expect(score4).toBe(0);
  });
});
