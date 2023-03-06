import { Specification as AntVSpec } from '../../../src/common/types';
import { DataFrame } from '../../../src/data';
import { Advisor } from '../../../src/advisor/index';
import { BasicDataPropertyForAdvice, RuleConfig, RuleModule } from '../../../src/advisor/ruler';
import { assembleDataProps } from '../../../src/advisor/advise-pipeline/advicesForChart';

const data = [
  { price: 100, type: 'A', volume: 1000 },
  { price: 120, type: 'B', volume: 1000 },
  { price: 150, type: 'C', volume: 1000 },
];

const myRule: RuleModule = {
  id: 'fufu-rule',
  type: 'HARD',
  docs: {
    lintText: 'listen to fufu',
  },
  trigger: (args) => {
    const { chartType } = args;
    return ['pie_chart'].includes(chartType);
  },
  validator: (args) => {
    let result = 1;
    const { dataProps } = args;
    if (dataProps.length && dataProps[0].secMin > 0) {
      result = 0;
    }
    return result;
  },
};

const spec: AntVSpec = {
  basis: {
    type: 'chart',
  },
  data: {
    type: 'json-array',
    values: [
      { category: 'A', value: 4 },
      { category: 'B', value: 6 },
      { category: 'C', value: 10 },
      { category: 'D', value: 3 },
      { category: 'E', value: 7 },
      { category: 'F', value: 8 },
    ],
  },
  layer: [
    {
      mark: 'arc',
      encoding: {
        theta: { field: 'value', type: 'quantitative' },
        color: {
          field: 'category',
          type: 'nominal',
          scale: { range: ['#5b8ff9', '#753d91', '#b03c63', '#d5b471', '#4fb01f', '#608b7d'] },
        },
      },
    },
  ],
};

describe('dataprops test', () => {
  test('customized dataprops and rule to lint', () => {
    const df = new DataFrame(data, { columns: ['price', 'type'] });
    const dp = df.info() as BasicDataPropertyForAdvice[];
    const newDps = dp.map((p) => {
      return { ...p, secMin: 120 };
    });
    const myRuleCfg: RuleConfig = {
      include: ['bar-series-qty'],
      custom: {
        'fufu-rule': myRule,
      },
    };
    const myAdvisor = new Advisor({ ruleCfg: myRuleCfg });
    const results = myAdvisor.lint({ spec, dataProps: newDps });
    expect(results.length).toBe(1);
    expect(results[0].id).toBe('fufu-rule');
  });

  test('customized dataProps', () => {
    const defaultProps = assembleDataProps(data, ['price', 'type']);
    const defaultTypeOfPrice = defaultProps.find((item) => item.name === 'price')?.levelOfMeasurements;

    const userSpecifiedProps = [
      { name: 'price', levelOfMeasurements: ['Interval'] },
    ] as Partial<BasicDataPropertyForAdvice>[];
    const customProps = assembleDataProps(data, ['price', 'type'], userSpecifiedProps);
    const customTypeOfPrice = customProps.find((item) => item.name === 'price')?.levelOfMeasurements;

    expect(defaultTypeOfPrice).toEqual(['Interval', 'Discrete']);
    expect(customTypeOfPrice).toEqual(['Interval']);
  });
});
