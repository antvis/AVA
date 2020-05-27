import { insightsFromData, getInsightSpaces, workerCollection, DefaultIWorker, IWorker } from '../src/insight';

test('insights', () => {
  const data = [
    { A: 43, B: 99, C: 87, D: 57 },
    { A: 21, B: 65, C: 56, D: 80 },
    { A: 25, B: 79, C: 69, D: 75 },
    { A: 42, B: 75, C: 63, D: 60 },
    { A: 57, B: 87, C: 77, D: 43 },
    { A: 59, B: 81, C: 78, D: 40 },
  ];
  expect(insightsFromData(data)).toStrictEqual([
    {
      type: 'Correlation',
      fields: ['A', 'D'],
    },
    {
      type: 'Correlation',
      fields: ['B', 'C'],
    },
  ]);
});

test('worker collection exists', () => {
  expect(workerCollection).toBeTruthy();
});

test('default workers can be accessed', () => {
  let defaultWorkerCount = 0;
  workerCollection.each(() => {
    defaultWorkerCount++;
  });
  expect(defaultWorkerCount).toBe(Object.keys(DefaultIWorker).length);
  const checkList: { [key: string]: boolean } = {};
  Object.values(DefaultIWorker).forEach((k) => {
    checkList[k] = false;
  });
  workerCollection.enable(DefaultIWorker.cluster, false);
  workerCollection.each((_, name) => {
    if (name) {
      checkList[name] = true;
    }
  });
  expect(checkList).toEqual({
    [DefaultIWorker.cluster]: false,
    [DefaultIWorker.outlier]: true,
    [DefaultIWorker.trend]: true,
  });
});

test('custom worker', () => {
  const testWorker: IWorker = async () => null;
  workerCollection.register('test', testWorker);
  let isTestWorkerRegistered = false;
  workerCollection.each((_, name) => {
    if (name === 'test') isTestWorkerRegistered = true;
  });
  workerCollection.enable('test', false);
  expect(isTestWorkerRegistered).toBe(true);
});

test('getInsightSpaces exists', () => {
  expect(getInsightSpaces).toBeTruthy();
});

test('custom worker can be run', async () => {
  const data = [
    { date: '1996-12-16', age: 0, weight: 20.5 },
    { date: '1998-2-3', age: 1, weight: 40.8 },
    { date: '1998-12-25', age: 2, weight: 23.3 },
    { date: '1999-6-1', age: 2, weight: null },
    { date: '2000-12-16', age: 4, weight: 23.9 },
    { date: '2002-8-10', age: 5, weight: 65.0 },
  ];
  const exampleIWorkerName = 'cardinality';

  const exampleIWorker: IWorker = async (aggData, dimensions, measures) => {
    if (dimensions.length === 0 || measures.length === 0 || aggData.length === 0) return null;
    const sig = 1 / Math.pow(dimensions.length * measures.length * aggData.length, 1 / 4);
    return {
      dimensions,
      measures,
      significance: sig,
      type: exampleIWorkerName,
    };
  };
  workerCollection.register(exampleIWorkerName, exampleIWorker);
  workerCollection.enable(DefaultIWorker.cluster, false);
  workerCollection.enable(DefaultIWorker.outlier, false);
  workerCollection.enable(DefaultIWorker.trend, false);
  const spaces = await getInsightSpaces({
    dataSource: data,
    collection: workerCollection,
  });
  expect(spaces.length > 0).toBe(true);
  spaces.forEach((space) => {
    expect(space.type).toBe(exampleIWorkerName);
  });
});
