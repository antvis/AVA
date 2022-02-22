import { SingleMeasureMultiDimensionAttribution } from '../../src/attribution/multiDimension';

const data = [
  {
    City: 'huangshishi',
    Province: 'shanxi',
    ClientGender: 'male',
    OrderDate: '2022/2/19',
    Price: 13722.76,
    UnitCost: 292.72,
  },
  {
    City: 'huangshishi',
    Province: 'shanxi',
    ClientGender: 'male',
    OrderDate: '2022/2/21',
    Price: 24020.88,
    UnitCost: 5447.57,
  },
  {
    City: 'huangshishi',
    Province: 'shanxi',
    ClientGender: 'male',
    OrderDate: '2022/2/16',
    Price: 40145.8,
    UnitCost: 3696.42,
  },
  {
    City: 'huang gang shi',
    Province: 'qinghai',
    ClientGender: 'male',
    OrderDate: '2022/2/18',
    Price: 99980.16,
    UnitCost: 34393.38,
  },
  {
    City: 'huanggangshi',
    Province: 'qinghai',
    ClientGender: 'ma le',
    OrderDate: '2022/2/17',
    Price: 12656.11,
    UnitCost: 6012.96,
  },
  {
    City: 'huanggangshi',
    Province: 'qinghai',
    ClientGender: 'male',
    OrderDate: '2022/2/19',
    Price: 42464.05,
    UnitCost: 3113.68,
  },
];
describe('MultiDim Test', () => {
  test('check the disassemable result', () => {
    const dataConfig = {
      sourceData: data,
      dimensions: ['Province', 'City'],
      measure: 'Price',
    };

    const fluctInfo = {
      fluctDim: 'OrderDate',
      baseInterval: {
        startPoint: '2022/2/17',
        endPoint: '2022/2/18',
      },
      currInterval: {
        startPoint: '2022/2/19',
        endPoint: '2022/2/20',
      },
    };
    const attributionObject = new SingleMeasureMultiDimensionAttribution(dataConfig, fluctInfo);
    const tempResult = attributionObject.getWholeData();
    expect(tempResult.City.disassyDetails.huangshishi.currValue).toBe(13722.76);
  });
});
