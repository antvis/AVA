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
  { price: 100, type: 'A' },
  { price: 120, type: 'B' },
  { price: 150, type: 'C' },
];

describe('init Advisor', () => {
  //   // TODO more tests about data that DW cannot handle, return empty advice list.
  test('data to advices 111', () => {
    const myAdvisor = new Advisor();
    const advices = myAdvisor.advise(data, ['price', 'type'], { refine: true });
    // 4 -> pie / donut / bar / column
    expect(advices.length).toBe(4);
  });

  test('data to advices with customized chart', () => {
    const myCKBCfg: CKBConfig = {
      include: ['line_chart', 'pie_chart'],
    };
    const myAdvisor = new Advisor(myCKBCfg);
    const advices = myAdvisor.advise(data, ['price', 'type'], { refine: true });
    // 1 -> pie
    expect(advices.length).toBe(1);
  });

  test('data to advices with ckb config', () => {
    const myCKBCfg: CKBConfig = {
      exclude: ['line_chart', 'pie_chart'],
    };
    const myAdvisor = new Advisor(myCKBCfg);
    const advices = myAdvisor.advise(data, ['price', 'type'], { refine: true });
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
    const myAdvisor = new Advisor(myCKBCfg);
    const advices = myAdvisor.advise(data, ['price', 'type'], { refine: true });
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
    const myAdvisor = new Advisor(undefined, myRuleCfg);
    const advices = myAdvisor.advise(data, ['price', 'type'], { refine: true });
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
    const myAdvisor = new Advisor(undefined, myRuleCfg);
    const advices = myAdvisor.advise(data, ['price', 'type'], { refine: true });
    // 5 -> donut / bar / column / histogram / pie,
    // the rule to avoid pie_chart is turn off in options
    expect(advices.length).toBe(5);
  });
});

describe('init Linter', () => {
  test('Linter', () => {
    // TODO param and output
    const myLt = new Linter();
    const errors = myLt.lint({});
    expect(errors.length).toBe(0);
  });
});

describe('init ChartAdvisor', () => {
  // TODO formal test
  test('dataToAdvices in CA', () => {
    const myCA = new ChartAdvisor();
    expect(myCA.dataToAdvices([])).toBe('dataToAdvices in CA.');
  });
});
