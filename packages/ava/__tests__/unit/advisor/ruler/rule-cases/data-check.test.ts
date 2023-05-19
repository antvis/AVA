import { CHART_IDS, ckb } from '../../../../../src';
import { ChartRuleModule, Info } from '../../../../../src/advisor/ruler';
import { dataCheck } from '../../../../../src/advisor/ruler/rules/data-check';
import { ChartKnowledge } from '../../../../../src/ckb';
import { verifyDataProps } from '../../../../../src/advisor/ruler/utils';

const applyChartTypes = CHART_IDS;

const dataProps = [
  {
    count: 3,
    distinct: 3,
    type: 'string',
    recommendation: 'string',
    missing: 0,
    rawData: ['a', 'b', 'c'],
    valueMap: { a: 1, b: 1, c: 1 },
    maxLength: 1,
    minLength: 1,
    meanLength: 1,
    containsChar: true,
    containsDigit: false,
    containsSpace: false,
    levelOfMeasurements: ['Nominal'],
    name: 'f1',
  },
  {
    count: 3,
    distinct: 1,
    type: 'integer',
    recommendation: 'integer',
    missing: 0,
    rawData: [10, 10, 10],
    valueMap: { '10': 3 },
    minimum: 10,
    maximum: 10,
    mean: 10,
    percentile5: 10,
    percentile25: 10,
    percentile50: 10,
    percentile75: 10,
    percentile95: 10,
    sum: 30,
    variance: 0,
    standardDeviation: 0,
    zeros: 0,
    levelOfMeasurements: ['Interval', 'Discrete'],
    name: 'f2',
  },
];

describe('Test: data-check', () => {
  test('type', () => {
    expect(dataCheck.type).toBe('HARD');
  });

  test('trigger', () => {
    applyChartTypes.forEach((chartType) => {
      expect(
        dataCheck.trigger({
          chartType,
          dataProps: undefined,
        })
      ).toBe(true);
    });
  });

  expect(
    (dataCheck as ChartRuleModule).validator({
      chartType: 'bar_chart',
      chartWIKI: ckb(),
      dataProps: dataProps as Info['dataProps'],
    })
  ).toBe(1);

  expect(
    (dataCheck as ChartRuleModule).validator({
      chartType: 'line_chart',
      chartWIKI: ckb(),
      dataProps: dataProps as Info['dataProps'],
    })
  ).toBe(0);
});

describe('Test: all fields should be mapped', () => {
  const testProps = [
    {
      count: 56,
      distinct: 8,
      type: 'string',
      recommendation: 'string',
      missing: 0,
      rawData: [],
      valueMap: {},
      maxLength: 3,
      minLength: 2,
      meanLength: 2.875,
      containsChar: false,
      containsDigit: false,
      containsSpace: false,
      levelOfMeasurements: ['Nominal'],
      name: '地区',
    },
    {
      count: 56,
      distinct: 53,
      type: 'integer',
      recommendation: 'integer',
      missing: 0,
      rawData: [],
      valueMap: {},
      minimum: 1400,
      maximum: 192100,
      mean: 90119.64285714286,
      percentile5: 1900,
      percentile25: 45900,
      percentile50: 98300,
      percentile75: 127000,
      percentile95: 181000,
      sum: 5046700,
      variance: 3156225864.1581635,
      standardDeviation: 56180.29782902689,
      zeros: 0,
      levelOfMeasurements: ['Interval', 'Discrete'],
      name: '销量',
    },
    {
      count: 56,
      distinct: 1,
      type: 'string',
      recommendation: 'string',
      missing: 0,
      rawData: [],
      valueMap: { '人群=标签圈人1': 56 },
      maxLength: 8,
      minLength: 8,
      meanLength: 8,
      containsChar: false,
      containsDigit: true,
      containsSpace: false,
      levelOfMeasurements: ['Nominal'],
      name: 'groupId',
    },
    {
      count: 56,
      distinct: 7,
      type: 'date',
      recommendation: 'date',
      missing: 0,
      rawData: [],
      valueMap: {},
      minimum: '2023-05-12',
      maximum: '2023-05-18',
      levelOfMeasurements: ['Time'],
      name: '日期',
    },
  ];

  const testCkb = {
    id: 'group_column_tech_vis',
    name: 'group_column_tech_vis',
    alias: ['group_column_tech_vis'],
    family: ['ColumnCharts'],
    def: 'Group Column Chart implemented by TechVis',
    purpose: ['Comparison', '', 'Trend'],
    coord: ['Cartesian2D'],
    category: ['Statistic'],
    shape: ['Bars'],
    dataPres: [
      { minQty: 1, maxQty: '*', fieldConditions: ['Interval'] },
      { minQty: 1, maxQty: 2, fieldConditions: ['Nominal'] },
    ],
    channel: ['Color', 'Length', 'Position'],
    recRate: 'Recommended',
  };

  const falseValidator = (args): number => {
    let result = 0;
    const { dataProps, chartType, chartWIKI } = args;

    if (dataProps && chartType && chartWIKI[chartType]) {
      result = 1;
      const dataPres = chartWIKI[chartType].dataPres || [];
      dataPres.forEach((dataPre) => {
        if (!verifyDataProps(dataPre, dataProps)) {
          result = 0;
        }
      });
    }
    return result;
  };
  test('Revised Validator', () => {
    expect(
      (dataCheck as ChartRuleModule).validator({
        chartType: 'group_column_tech_vis',
        chartWIKI: { group_column_tech_vis: testCkb as ChartKnowledge },
        dataProps: testProps as Info['dataProps'],
      })
    ).toBe(0);
  });
  test('Previous Validator', () => {
    expect(
      falseValidator({
        chartType: 'group_column_tech_vis',
        chartWIKI: { group_column_tech_vis: testCkb as ChartKnowledge },
        dataProps: testProps as Info['dataProps'],
      })
    ).toBe(1);
  });
});
