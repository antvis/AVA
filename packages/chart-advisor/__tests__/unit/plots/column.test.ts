import { dataToSpecs, specToLibConfig, g2plotRender, G2PlotConfig } from '../../../src';
import { createDiv } from '../../utils/dom';

const data = [
  { 地区: '华东', 销售额: 4684506.442 },
  { 地区: '中南', 销售额: 4137415.0929999948 },
  { 地区: '东北', 销售额: 2681567.469000001 },
  { 地区: '华北', 销售额: 2447301.017000004 },
  { 地区: '西北', 销售额: 815039.5959999998 },
  { 地区: '西南', 销售额: 1303124.508000002 },
];

describe('column', () => {
  const specs = dataToSpecs(data);
  const columnSpecs = specs.find((spec) => spec.type === 'column_chart');

  it('data - specs', () => {
    expect(specs.length).not.toBe(0);
    expect(columnSpecs).not.toBeNull;
  });

  if (columnSpecs) {
    const libConfig: G2PlotConfig = specToLibConfig(columnSpecs);

    it('vega specs test', () => {
      // @ts-ignore
      expect(columnSpecs.spec.mark.type).toBe('bar');
    });

    it('spec - lib config', () => {
      expect(libConfig.type).toBe('Column');
      expect(libConfig.configs.xField).toBe('地区');
      expect(libConfig.configs.xField).toBe('地区');
      expect(libConfig.configs.yField).toBe('销售额');
    });

    it('g2plot render', () => {
      g2plotRender(createDiv(), data, libConfig);
    });
  }
});
