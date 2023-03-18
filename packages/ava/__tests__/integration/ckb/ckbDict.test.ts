import { COORDINATE_SYSTEMS, ckbDict } from '../../../src/ckb';

describe('ckbDict usage', () => {
  test('use ckbDict to get Chinese coord names', () => {
    const cn = ckbDict('zh-CN');
    const cnCoordOptions = COORDINATE_SYSTEMS.map((coord) => cn.concepts.coord[coord]);

    expect(cnCoordOptions).toEqual([
      '数轴',
      '二维直角坐标系',
      '对称直角坐标系',
      '三维直角坐标系',
      '极坐标系',
      '点线关系网络',
      '雷达型坐标系',
      '地理坐标系',
      '其他',
    ]);
  });
});
