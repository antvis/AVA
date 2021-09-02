import { AntVSpec } from '@antv/antv-spec';
import { CustomizedCKBJSON, CKBConfig } from '../src/advisor/ckb-config';
import { Advisor } from '../src/advisor';
import { Linter } from '../src/linter';
import { BasicDataPropertyForAdvice, RuleConfig, RuleModule } from '../src/ruler';
import { ChartAdvisor } from '../src/chart-advisor';
import { hasSubset } from '../src/utils';
import { DataRows } from '../src/advisor/advice-pipeline/interface';

const myRule: RuleModule = {
  id: 'fufu-rule',
  type: 'HARD',
  chartTypes: ['pie_chart'],
  docs: {
    lintText: 'listen to fufu',
  },
  validator: (args) => {
    let result = 1;
    const { dataProps } = args;
    if (dataProps.length > 1) {
      result = 0;
    }
    return result;
  },
};

const data = [
  { price: 100, type: 'A', series: 'X' },
  { price: 120, type: 'B', series: 'Y' },
  { price: 150, type: 'C', series: 'Z' },
];

describe('init Advisor', () => {
  test('data to advices 111', () => {
    const myAdvisor = new Advisor();
    const advices = myAdvisor.advise({data, fields: ['price', 'type'], options: { refine: true }});
    // 4 -> pie / donut / bar / column
    expect(advices.length).toBe(4);
  });

  test('data to advices with customized chart', () => {
    const myCKBCfg: CKBConfig = {
      include: ['line_chart', 'pie_chart'],
    };
    const myAdvisor = new Advisor({ckbCfg: myCKBCfg});
    const advices = myAdvisor.advise({data, fields: ['price', 'type'], options: { refine: true }});
    // 1 -> pie
    expect(advices.length).toBe(1);
  });

  test('data to advices with ckb config', () => {
    const myCKBCfg: CKBConfig = {
      exclude: ['line_chart', 'pie_chart'],
    };
    const myAdvisor = new Advisor({ckbCfg: myCKBCfg});
    const advices = myAdvisor.advise({data, fields: ['price', 'type'], options: { refine: true }});
    // 3 -> donut / bar / column
    expect(advices.length).toBe(3);
  });

  test('data to advices with ckb config custom chart', () => {
    const splitAngleColor = (dataProps: BasicDataPropertyForAdvice[]) => {
      const field4Color = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Nominal']));
      const field4Angle = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Interval']));
      return [field4Color, field4Angle];
    };

    const toFuChart = (data: DataRows, dataProps: BasicDataPropertyForAdvice[]): AntVSpec | null => {
      const [field4Color, field4Angle] = splitAngleColor(dataProps);
      if (!field4Angle || !field4Color) return null;

      const spec: AntVSpec = {
        basis: {
          type: 'chart',
        },
        data: {
          type: 'json-array',
          values: data,
        },
        layer: [
          {
            mark: {
              type: 'arc',
              style: {
                innerRadius: 0.8,
              },
            },
            encoding: {
              theta: { field: field4Angle.name, type: 'quantitative' },
              color: { field: field4Color.name, type: 'nominal' },
            },
          },
        ],
      };
      return spec;
    };
    const myChart: CustomizedCKBJSON = {
      id: 'fufu_chart',
      name: 'fufuChart',
      alias: ['futuChart'],
      family: ['fufuCharts'],
      def: 'This chart is defined by fufu',
      purpose: ['Comparison', 'Composition', 'Proportion'],
      coord: ['Polar'],
      category: ['Statistic'],
      shape: ['Round'],
      dataPres: [
        { minQty: 1, maxQty: 1, fieldConditions: ['Nominal', 'Ordinal'] },
        { minQty: 1, maxQty: 1, fieldConditions: ['Interval'] },
      ],
      channel: ['Angle', 'Area', 'Color'],
      recRate: 'Use with Caution',
      toSpec: toFuChart,
    };
    const myCKBCfg: CKBConfig = {
      custom: {
        fufu_chart: myChart,
      },
      include: ['line_chart'],
    };
    const myAdvisor = new Advisor({ckbCfg: myCKBCfg});
    const advices = myAdvisor.advise({data, fields: ['price', 'type'], options: { refine: true }});
    // 1 -> fufu_chart
    expect(advices.length).toBe(1);
  });

  test('data to advices with custom rule', () => {
    const myRuleCfg: RuleConfig = {
      include: ['data-field-qty'],
      custom: {
        'fufu-rule': myRule,
      },
    };
    const myAdvisor = new Advisor({ruleCfg: myRuleCfg});
    const advices = myAdvisor.advise({data,fields: ['price', 'type'], options: { refine: true }});
    // 4 -> donut / bar / column / histogram, custom rule avoid pie_chart
    expect(advices.length).toBe(4);
  });

  test('data to advices with custom rule with option', () => {
    const myRuleCfg: RuleConfig = {
      include: ['data-field-qty'],
      custom: {
        'fufu-rule': myRule,
      },
      options: {
        'fufu-rule': {
          off: true,
        },
        'data-field-qty': {
          weight: 100,
        },
      },
    };
    const myAdvisor = new Advisor({ruleCfg: myRuleCfg});
    const advices = myAdvisor.advise({data, fields: ['price', 'type'], options: { refine: true }});
    // 5 -> donut / bar / column / histogram / pie,
    // the rule to avoid pie_chart is turn off in options
    expect(advices.length).toBe(5);
  });
});

describe('init Linter', () => {
  const errorSpec = {
    'basis': {
      'type': 'chart'
    },
    'data': {
      'type': 'json-array',
      'values': [
        { 'year': '2007', 'sales': 28 },
        { 'year': '2008', 'sales': 55 },
        { 'year': '2009', 'sales': 43 },
        { 'year': '2010', 'sales': 91 },
        { 'year': '2011', 'sales': 81 },
        { 'year': '2012', 'sales': 53 },
        { 'year': '2013', 'sales': 19 },
        { 'year': '2014', 'sales': 87 },
        { 'year': '2015', 'sales': 52 }
      ]
    },
    'layer': [
      {
        'mark': 'area',
        'encoding': {
          'x': {
            'field': 'year',
            'type': 'temporal'
          },
          'y': {
            'field': 'sales',
            'type': 'quantitative'
          }
        }
      }
    ]
  };

  test('Linter test 1', () => {
    const myLt = new Linter();
    const errors = myLt.lint({spec: errorSpec as AntVSpec});
    // FIXME: actual test after rule definition otimization
    expect(errors.length).toBe(2);
  });
});

describe('init ChartAdvisor', () => {
  // TODO formal test
  test('adviseWithLint in CA', () => {
    const myCA = new ChartAdvisor();
    const results = myCA.advise({data, fields: ['price', 'type'], options: { refine: true }});
    // FIXME: actual test after rule definition otimization
    expect(results.length).toBe(4);
  });
});
