/* eslint-disable no-template-curly-in-string */
import numeral from 'numeral';

import { generateTextSpec } from '../../src/ntv';

const fluctuationData = {
  analysisResult: {
    overview: {
      measureId: 'D2020120800161505000000674978',
      measureName: '单价',
      currentMeasureValue: 176266263.42,
      comparisonMeasureValue: 146262773.7,
      diff: 30003489.72,
      rate: 0.2051341497293101,
      isFraction: false,
    },
    impactFactor: {
      all: [
        {
          measureId: 'D2020120800161505000000674980',
          measureName: '数量',
          currentMeasureValue: 46239969,
          comparisonMeasureValue: 46191678,
          diff: 48291,
          rate: 0.001045448056682418,
          contribution: 1.0586254595355833,
          influenceOfWeight: null,
          isSimpsonMeasure: null,
          rateContribution: null,
          proportionContribution: null,
          currentProportion: null,
          comparisonProportion: null,
          subFactors: [
            {
              dimensionIds: ['D2020120800161505000000674983'],
              dimensions: [{ name: '商品子类别', value: '便签纸' }],
              dimensionNames: ['商品子类别'],
              dimensionValues: ['便签纸'],
              currentMeasureValue: 4255122,
              comparisonMeasureValue: 4053110,
              diff: 202012,
              rate: 0.04984123302846456,
              contribution: 4.428465890780937,
              influenceOfWeight: null,
              isSimpsonMeasure: false,
              rateContribution: null,
              proportionContribution: null,
              currentProportion: null,
              comparisonProportion: null,
              parentInfo: {
                measureInfo: {
                  measureId: 'D2020120800161505000000674980',
                  measureName: '数量',
                },
              },
            },
            {
              dimensionIds: ['D2020120800161505000000674983'],
              dimensionNames: ['商品子类别'],
              dimensionValues: ['纸张'],
              dimensions: [{ name: '商品子类别', value: '纸张' }],
              currentMeasureValue: 4127829,
              comparisonMeasureValue: 3964794,
              diff: 163035,
              rate: 0.04112067360876757,
              contribution: 3.5740200409058382,
              influenceOfWeight: null,
              isSimpsonMeasure: false,
              rateContribution: null,
              proportionContribution: null,
              currentProportion: null,
              comparisonProportion: null,
              parentInfo: {
                measureInfo: {
                  measureId: 'D2020120800161505000000674980',
                  measureName: '数量',
                },
              },
            },
            {
              dimensionIds: ['D2020120800161505000000674983'],
              dimensionNames: ['商品子类别'],
              dimensionValues: ['本子'],
              dimensions: [{ name: '商品子类别', value: '本子' }],
              currentMeasureValue: 4080766,
              comparisonMeasureValue: 4242152,
              diff: -161386,
              rate: -0.03804342701534504,
              contribution: -3.5378709989979424,
              influenceOfWeight: null,
              isSimpsonMeasure: false,
              rateContribution: null,
              proportionContribution: null,
              currentProportion: null,
              comparisonProportion: null,
              parentInfo: {
                measureInfo: {
                  measureId: 'D2020120800161505000000674980',
                  measureName: '数量',
                },
              },
            },
            {
              dimensionIds: ['D2020120800161505000000674974'],
              dimensionNames: ['销售渠道'],
              dimensionValues: ['沃尔玛'],
              dimensions: [{ name: '销售渠道', value: '沃尔玛' }],
              currentMeasureValue: 6542176,
              comparisonMeasureValue: 6685872,
              diff: -143696,
              rate: -0.02149248445079415,
              contribution: -3.15007442449784,
              influenceOfWeight: null,
              isSimpsonMeasure: false,
              rateContribution: null,
              proportionContribution: null,
              currentProportion: null,
              comparisonProportion: null,
              parentInfo: {
                measureInfo: {
                  measureId: 'D2020120800161505000000674980',
                  measureName: '数量',
                },
              },
            },
            {
              dimensionIds: ['D2020120800161505000000674974'],
              dimensionNames: ['销售渠道'],
              dimensionValues: ['家乐福'],
              dimensions: [{ name: '销售渠道', value: '家乐福' }],
              currentMeasureValue: 6674355,
              comparisonMeasureValue: 6531961,
              diff: 142394,
              rate: 0.021799579023818422,
              contribution: 3.121532245865893,
              influenceOfWeight: null,
              isSimpsonMeasure: false,
              rateContribution: null,
              proportionContribution: null,
              currentProportion: null,
              comparisonProportion: null,
              parentInfo: {
                measureInfo: {
                  measureId: 'D2020120800161505000000674980',
                  measureName: '数量',
                },
              },
            },
          ],
        },
        {
          measureId: 'D2020120800161505000000674975',
          measureName: '折扣',
          currentMeasureValue: 37805.02,
          comparisonMeasureValue: 40479.32,
          diff: -2674.300000000003,
          rate: -0.06606583312170271,
          contribution: -0.058625459535648745,
          influenceOfWeight: null,
          isSimpsonMeasure: null,
          rateContribution: null,
          proportionContribution: null,
          currentProportion: null,
          comparisonProportion: null,
          subFactors: [
            {
              dimensionIds: ['D2020120800161505000000674983'],
              dimensionNames: ['商品子类别'],
              dimensionValues: ['收纳具'],
              dimensions: [{ name: '商品子类别', value: '收纳具' }],
              currentMeasureValue: 1482.98,
              comparisonMeasureValue: 3460.33,
              diff: -1977.35,
              rate: -0.5714339383815994,
              contribution: -0.0433470636850073,
              influenceOfWeight: null,
              isSimpsonMeasure: true,
              rateContribution: null,
              proportionContribution: null,
              currentProportion: null,
              comparisonProportion: null,
              parentInfo: {
                measureInfo: {
                  measureId: 'D2020120800161505000000674975',
                  measureName: '折扣',
                },
              },
            },
            {
              dimensionIds: ['D2020120800161505000000674983'],
              dimensionNames: ['商品子类别'],
              dimensionValues: ['柜子'],
              dimensions: [{ name: '商品子类别', value: '柜子' }],
              currentMeasureValue: 2883.23,
              comparisonMeasureValue: 2075.56,
              diff: 807.67,
              rate: 0.3891335350459635,
              contribution: 0.017705577124166105,
              influenceOfWeight: null,
              isSimpsonMeasure: true,
              rateContribution: null,
              proportionContribution: null,
              currentProportion: null,
              comparisonProportion: null,
              parentInfo: {
                measureInfo: {
                  measureId: 'D2020120800161505000000674975',
                  measureName: '折扣',
                },
              },
            },
            {
              dimensionIds: ['D2020120800161505000000674983'],
              dimensionNames: ['商品子类别'],
              dimensionValues: ['电话'],
              dimensions: [{ name: '商品子类别', value: '电话' }],
              currentMeasureValue: 2259.37,
              comparisonMeasureValue: 1707.25,
              diff: 552.12,
              rate: 0.3233972763215698,
              contribution: 0.012103462109270607,
              influenceOfWeight: null,
              isSimpsonMeasure: true,
              rateContribution: null,
              proportionContribution: null,
              currentProportion: null,
              comparisonProportion: null,
              parentInfo: {
                measureInfo: {
                  measureId: 'D2020120800161505000000674975',
                  measureName: '折扣',
                },
              },
            },
            {
              dimensionIds: ['D2020120800161505000000674983'],
              dimensionNames: ['商品子类别'],
              dimensionValues: ['笔'],
              dimensions: [{ name: '商品子类别', value: '笔' }],
              currentMeasureValue: 1788.27,
              comparisonMeasureValue: 2327.47,
              diff: -539.2,
              rate: -0.23166786252884036,
              contribution: -0.011820232502569571,
              influenceOfWeight: null,
              isSimpsonMeasure: true,
              rateContribution: null,
              proportionContribution: null,
              currentProportion: null,
              comparisonProportion: null,
              parentInfo: {
                measureInfo: {
                  measureId: 'D2020120800161505000000674975',
                  measureName: '折扣',
                },
              },
            },
            {
              dimensionIds: ['D2020120800161505000000674983'],
              dimensionNames: ['商品子类别'],
              dimensionValues: ['信封'],
              dimensions: [{ name: '商品子类别', value: '信封' }],
              currentMeasureValue: 2097.72,
              comparisonMeasureValue: 2549.27,
              diff: -451.55,
              rate: -0.1771291389299682,
              contribution: -0.009898787067016487,
              influenceOfWeight: null,
              isSimpsonMeasure: true,
              rateContribution: null,
              proportionContribution: null,
              currentProportion: null,
              comparisonProportion: null,
              parentInfo: {
                measureInfo: {
                  measureId: 'D2020120800161505000000674975',
                  measureName: '折扣',
                },
              },
            },
          ],
        },
      ],
      positive: [
        {
          measureId: 'D2020120800161505000000674980',
          measureName: '数量',
          currentMeasureValue: 46239969,
          comparisonMeasureValue: 46191678,
          diff: 48291,
          rate: 0.001045448056682418,
          contribution: 1.0586254595355833,
          influenceOfWeight: null,
          isSimpsonMeasure: null,
          rateContribution: null,
          proportionContribution: null,
          currentProportion: null,
          comparisonProportion: null,
          subFactors: [
            {
              dimensionIds: ['D2020120800161505000000674983'],
              dimensionNames: ['商品子类别'],
              dimensionValues: ['便签纸'],
              currentMeasureValue: 4255122,
              comparisonMeasureValue: 4053110,
              diff: 202012,
              rate: 0.04984123302846456,
              contribution: 4.428465890780937,
              influenceOfWeight: null,
              isSimpsonMeasure: false,
              rateContribution: null,
              proportionContribution: null,
              currentProportion: null,
              comparisonProportion: null,
              parentInfo: {
                measureInfo: {
                  measureId: 'D2020120800161505000000674980',
                  measureName: '数量',
                },
              },
            },
            {
              dimensionIds: ['D2020120800161505000000674983'],
              dimensionNames: ['商品子类别'],
              dimensionValues: ['纸张'],
              currentMeasureValue: 4127829,
              comparisonMeasureValue: 3964794,
              diff: 163035,
              rate: 0.04112067360876757,
              contribution: 3.5740200409058382,
              influenceOfWeight: null,
              isSimpsonMeasure: false,
              rateContribution: null,
              proportionContribution: null,
              currentProportion: null,
              comparisonProportion: null,
              parentInfo: {
                measureInfo: {
                  measureId: 'D2020120800161505000000674980',
                  measureName: '数量',
                },
              },
            },
            {
              dimensionIds: ['D2020120800161505000000674974'],
              dimensionNames: ['销售渠道'],
              dimensionValues: ['家乐福'],
              currentMeasureValue: 6674355,
              comparisonMeasureValue: 6531961,
              diff: 142394,
              rate: 0.021799579023818422,
              contribution: 3.121532245865893,
              influenceOfWeight: null,
              isSimpsonMeasure: false,
              rateContribution: null,
              proportionContribution: null,
              currentProportion: null,
              comparisonProportion: null,
              parentInfo: {
                measureInfo: {
                  measureId: 'D2020120800161505000000674980',
                  measureName: '数量',
                },
              },
            },
            {
              dimensionIds: ['D2020120800161505000000674983'],
              dimensionNames: ['商品子类别'],
              dimensionValues: ['柜子'],
              currentMeasureValue: 2070904,
              comparisonMeasureValue: 1968475,
              diff: 102429,
              rate: 0.05203469691004458,
              contribution: 2.2454276613607145,
              influenceOfWeight: null,
              isSimpsonMeasure: false,
              rateContribution: null,
              proportionContribution: null,
              currentProportion: null,
              comparisonProportion: null,
              parentInfo: {
                measureInfo: {
                  measureId: 'D2020120800161505000000674980',
                  measureName: '数量',
                },
              },
            },
            {
              dimensionIds: ['D2020120800161505000000674974'],
              dimensionNames: ['销售渠道'],
              dimensionValues: ['其他'],
              currentMeasureValue: 6758960,
              comparisonMeasureValue: 6658057,
              diff: 100903,
              rate: 0.015155021953101333,
              contribution: 2.211975000383487,
              influenceOfWeight: null,
              isSimpsonMeasure: false,
              rateContribution: null,
              proportionContribution: null,
              currentProportion: null,
              comparisonProportion: null,
              parentInfo: {
                measureInfo: {
                  measureId: 'D2020120800161505000000674980',
                  measureName: '数量',
                },
              },
            },
          ],
        },
      ],
      negative: [
        {
          measureId: 'D2020120800161505000000674975',
          measureName: '折扣',
          currentMeasureValue: 37805.02,
          comparisonMeasureValue: 40479.32,
          diff: -2674.300000000003,
          rate: -0.06606583312170271,
          contribution: -0.058625459535648745,
          influenceOfWeight: null,
          isSimpsonMeasure: null,
          rateContribution: null,
          proportionContribution: null,
          currentProportion: null,
          comparisonProportion: null,
          subFactors: [
            {
              dimensionIds: ['D2020120800161505000000674983'],
              dimensionNames: ['商品子类别'],
              dimensionValues: ['收纳具'],
              currentMeasureValue: 1482.98,
              comparisonMeasureValue: 3460.33,
              diff: -1977.35,
              rate: -0.5714339383815994,
              contribution: -0.0433470636850073,
              influenceOfWeight: null,
              isSimpsonMeasure: true,
              rateContribution: null,
              proportionContribution: null,
              currentProportion: null,
              comparisonProportion: null,
              parentInfo: {
                measureInfo: {
                  measureId: 'D2020120800161505000000674975',
                  measureName: '折扣',
                },
              },
            },
            {
              dimensionIds: ['D2020120800161505000000674983'],
              dimensionNames: ['商品子类别'],
              dimensionValues: ['笔'],
              currentMeasureValue: 1788.27,
              comparisonMeasureValue: 2327.47,
              diff: -539.2,
              rate: -0.23166786252884036,
              contribution: -0.011820232502569571,
              influenceOfWeight: null,
              isSimpsonMeasure: true,
              rateContribution: null,
              proportionContribution: null,
              currentProportion: null,
              comparisonProportion: null,
              parentInfo: {
                measureInfo: {
                  measureId: 'D2020120800161505000000674975',
                  measureName: '折扣',
                },
              },
            },
            {
              dimensionIds: ['D2020120800161505000000674983'],
              dimensionNames: ['商品子类别'],
              dimensionValues: ['信封'],
              currentMeasureValue: 2097.72,
              comparisonMeasureValue: 2549.27,
              diff: -451.55,
              rate: -0.1771291389299682,
              contribution: -0.009898787067016487,
              influenceOfWeight: null,
              isSimpsonMeasure: true,
              rateContribution: null,
              proportionContribution: null,
              currentProportion: null,
              comparisonProportion: null,
              parentInfo: {
                measureInfo: {
                  measureId: 'D2020120800161505000000674975',
                  measureName: '折扣',
                },
              },
            },
            {
              dimensionIds: ['D2020120800161505000000674974'],
              dimensionNames: ['销售渠道'],
              dimensionValues: ['大润发'],
              currentMeasureValue: 5312.19,
              comparisonMeasureValue: 5740.92,
              diff: -428.73,
              rate: -0.07467966806713906,
              contribution: -0.00939853167809097,
              influenceOfWeight: null,
              isSimpsonMeasure: true,
              rateContribution: null,
              proportionContribution: null,
              currentProportion: null,
              comparisonProportion: null,
              parentInfo: {
                measureInfo: {
                  measureId: 'D2020120800161505000000674975',
                  measureName: '折扣',
                },
              },
            },
            {
              dimensionIds: ['D2020120800161505000000674974'],
              dimensionNames: ['销售渠道'],
              dimensionValues: ['沃尔玛'],
              currentMeasureValue: 5372.16,
              comparisonMeasureValue: 5781.95,
              diff: -409.79,
              rate: -0.07087401309246881,
              contribution: -0.008983332858360504,
              influenceOfWeight: null,
              isSimpsonMeasure: true,
              rateContribution: null,
              proportionContribution: null,
              currentProportion: null,
              comparisonProportion: null,
              parentInfo: {
                measureInfo: {
                  measureId: 'D2020120800161505000000674975',
                  measureName: '折扣',
                },
              },
            },
          ],
        },
      ],
    },
  },
  analysisTime: ['2022-11-12', '2022-11-18'],
  comparisonMode: '环比',
  comparisonTime: ['2022-11-05', '2022-11-11'],
  prefixCls: 'di-embed-summary',
  factorType: 'all',
  measures: [
    {
      queryFieldName: '单价',
      queryFieldId: 'beb66404-a90c-4637-9c3c-b1deaa17c6c9',
      fieldName: '单价',
      fieldId: 'D2020120800161505000000674978',
      aggregateMethod: 'sum',
      format: 'auto',
    },
    {
      queryFieldName: '数量',
      queryFieldId: '318b17f4-6fcc-48c7-afd8-fa34f0a55730',
      fieldName: '数量',
      fieldId: 'D2020120800161505000000674980',
      aggregateMethod: 'sum',
      format: 'auto',
    },
    {
      queryFieldName: '折扣',
      queryFieldId: '5d22b7a2-7989-43ed-9a45-40ab587be106',
      fieldName: '折扣',
      fieldId: 'D2020120800161505000000674975',
      aggregateMethod: 'sum',
      format: 'auto',
    },
  ],
  showMeasuresConfig: true,
  anomalyExplanationConfig: {
    showAnomalyPhrase: false,
  },
  deepDrillDownDimensions: [
    {
      queryFieldName: '物流方式',
      queryFieldId: '19155f3f-83ac-4364-91e3-2cda45f8a015',
      fieldName: '物流方式',
      fieldId: 'D2020120800161505000000674977',
    },
    {
      queryFieldName: '商品子类别',
      queryFieldId: 'f903b673-1ece-4b84-8984-f0c7d49e5940',
      fieldName: '商品子类别',
      fieldId: 'D2020120800161505000000674983',
    },
    {
      queryFieldName: '销售渠道',
      queryFieldId: '6a8af850-5b84-4c4d-9201-99e87d13e77f',
      fieldName: '销售渠道',
      fieldId: 'D2020120800161505000000674974',
    },
  ],
};

describe('utils test', () => {
  test('use structureTemps', () => {
    expect(
      JSON.stringify(
        generateTextSpec({
          structures: [
            {
              template: '${measureName}是${measureValue}，排名前三的城市是&{city}。',
              variableMetaMap: {
                measureName: {
                  varType: 'metric_name',
                },
                measureValue: {
                  varType: 'metric_value',
                },
              },
            },
          ],
          structureTemps: [
            {
              templateId: 'city',
              template: '${.name}(${.value})',
              useVariable: 'top3',
              separator: '、',
              variableMetaMap: {
                '.name': {
                  varType: 'dim_value',
                },
                '.value': {
                  varType: 'metric_value',
                },
              },
            },
          ],
          variable: {
            measureName: '单价',
            measureValue: 1.23,
            top3: [
              {
                name: '北京',
                value: 1000,
              },
              {
                name: '上海',
                value: 800,
              },
              {
                name: '杭州',
                value: 600,
              },
            ],
          },
        })
      )
    ).toEqual(
      JSON.stringify({
        sections: [
          {
            paragraphs: [
              {
                type: 'normal',
                phrases: [
                  {
                    type: 'entity',
                    value: '单价',
                    metadata: {
                      entityType: 'metric_name',
                    },
                  },
                  {
                    type: 'text',
                    value: '是',
                  },
                  {
                    type: 'entity',
                    value: '1.23',
                    metadata: {
                      entityType: 'metric_value',
                      origin: 1.23,
                    },
                  },
                  {
                    type: 'text',
                    value: '，排名前三的城市是',
                  },
                  {
                    type: 'entity',
                    value: '北京',
                    metadata: {
                      entityType: 'dim_value',
                    },
                  },
                  {
                    type: 'text',
                    value: '(',
                  },
                  {
                    type: 'entity',
                    value: '1000',
                    metadata: {
                      entityType: 'metric_value',
                      origin: 1000,
                    },
                  },
                  {
                    type: 'text',
                    value: ')',
                  },
                  {
                    type: 'text',
                    value: '、',
                  },
                  {
                    type: 'entity',
                    value: '上海',
                    metadata: {
                      entityType: 'dim_value',
                    },
                  },
                  {
                    type: 'text',
                    value: '(',
                  },
                  {
                    type: 'entity',
                    value: '800',
                    metadata: {
                      entityType: 'metric_value',
                      origin: 800,
                    },
                  },
                  {
                    type: 'text',
                    value: ')',
                  },
                  {
                    type: 'text',
                    value: '、',
                  },
                  {
                    type: 'entity',
                    value: '杭州',
                    metadata: {
                      entityType: 'dim_value',
                    },
                  },
                  {
                    type: 'text',
                    value: '(',
                  },
                  {
                    type: 'entity',
                    value: '600',
                    metadata: {
                      entityType: 'metric_value',
                      origin: 600,
                    },
                  },
                  {
                    type: 'text',
                    value: ')',
                  },
                  {
                    type: 'text',
                    value: '。',
                  },
                ],
              },
            ],
          },
        ],
      })
    );
  });

  test('bullet structure', () => {
    expect(
      JSON.stringify(
        generateTextSpec({
          structures: [
            {
              // 2022-11-12 ~ 2022-11-18，单价1.76亿，环比+3,000.35万（1.46亿 -> 1.76亿），变化率20.51%。
              template: '${analysisTime[0]} ~ ${analysisTime[1]}，&{mainMeasureDesc}，&{mainMeasureCompareAnalytic}。',
              variableMetaMap: {
                'analysisTime[0]': {
                  varType: 'time_desc',
                },
                'analysisTime[1]': {
                  varType: 'time_desc',
                },
              },
              className: 'overview',
            },
            {
              template: '波动主要影响因素：',
              className: 'summary-title',
            },
            {
              // 数量，变化差值+4.83万 (4,619.17万 -> 4,624.00万)，变化率0.10%，对整体波动的贡献度是105.86%。
              template:
                '${.measureName}，变化差值 ${_customDeltaValue}，变化率 ${.rate}，对整体波动贡献度是 ${.contribution} ${_drillDownDims}。',
              displayType: 'bullet',
              useVariable: 'analysisResult.impactFactor.all',
              bulletOrder: true,
              className: 'summary-detail',
              variableMetaMap: {
                '.measureName': {
                  varType: 'metric_name',
                },
                _customDeltaValue: {
                  varType: 'custom_delta_value',
                  extraCustomMeta: (gv, sv) => ({
                    diff: sv?.diff,
                    compare: sv?.comparisonMeasureValue,
                    current: sv?.currentMeasureValue,
                  }),
                },
                '.rate': {
                  varType: 'ratio_value',
                  formatter: (value) => numeral(value).format('0.00%'),
                },
                '.contribution': {
                  varType: 'contribute_ratio',
                  formatter: (value) => numeral(value).format('0.00%'),
                },
                _drillDownDims: {
                  varType: 'drill_down_dims',
                  extraCustomMeta: (gv) => ({
                    dims: gv.deepDrillDownDimensions,
                  }),
                },
              },
              children: {
                // 商品子类别 = 便签纸，变化差值+20.20万 (405.31万 -> 425.51万)，变化率4.98%，对整体波动的贡献度是442.85%。
                template:
                  '&{drillDownDims}，变化差值 ${_customDeltaValue}，变化率 ${.rate}，对整体波动贡献度是 ${.contribution} ${_drillDownDims}。',
                useVariable: '.subFactors',
                bulletOrder: true,
                variableMetaMap: {
                  _customDeltaValue: {
                    varType: 'custom_delta_value',
                    extraCustomMeta: (gv, sv) => ({
                      diff: sv?.diff,
                      compare: sv?.comparisonMeasureValue,
                      current: sv?.currentMeasureValue,
                    }),
                  },
                  _drillDownDims: {
                    varType: 'drill_down_dims',
                    extraCustomMeta: (gv) => ({
                      dims: gv.deepDrillDownDimensions,
                    }),
                  },
                  '.rate': {
                    varType: 'ratio_value',
                    formatter: (value) => numeral(value).format('0.00%'),
                  },
                  '.contribution': {
                    varType: 'contribute_ratio',
                    formatter: (value) => numeral(value).format('0.00%'),
                  },
                },
              },
            },
          ],
          structureTemps: [
            {
              templateId: 'mainMeasureDesc',
              template: '${.measureName} ${.currentMeasureValue}',
              useVariable: 'analysisResult.overview',
              variableMetaMap: {
                '.measureName': {
                  varType: 'metric_name',
                },
                '.currentMeasureValue': {
                  varType: 'metric_value',
                  formatter: (value) => numeral(value).format('0.0a'),
                },
              },
            },
            {
              templateId: 'mainMeasureCompareAnalytic',
              template: '${comparisonMode} ${_customDeltaValue}，变化率 ${.rate}',
              useVariable: 'analysisResult.overview',
              variableMetaMap: {
                _customDeltaValue: {
                  varType: 'custom_delta_value',
                  extraCustomMeta: (gv, sv) => ({
                    diff: sv?.diff,
                    compare: sv?.comparisonMeasureValue,
                    current: sv?.currentMeasureValue,
                  }),
                },
                '.rate': {
                  varType: 'ratio_value',
                  formatter: (value) => numeral(value).format('0.0%'),
                },
              },
            },
            {
              templateId: 'drillDownDims',
              template: '${_dims}',
              useVariable: '.dimensions',
              separator: '，',
              variableMetaMap: {
                _dims: {
                  varType: 'dim_value',
                  getDisplayValue: '${.name} = ${.value}',
                },
              },
            },
          ],
          variable: {
            ...fluctuationData,
          },
        })
      )
    ).toStrictEqual(
      JSON.stringify({
        sections: [
          {
            paragraphs: [
              {
                type: 'normal',
                phrases: [
                  {
                    type: 'entity',
                    value: '2022-11-12',
                    metadata: {
                      entityType: 'time_desc',
                    },
                  },
                  {
                    type: 'text',
                    value: ' ~ ',
                  },
                  {
                    type: 'entity',
                    value: '2022-11-18',
                    metadata: {
                      entityType: 'time_desc',
                    },
                  },
                  {
                    type: 'text',
                    value: '，',
                  },
                  {
                    type: 'entity',
                    value: '单价',
                    metadata: {
                      entityType: 'metric_name',
                    },
                  },
                  {
                    type: 'text',
                    value: ' ',
                  },
                  {
                    type: 'entity',
                    value: '176.3m',
                    metadata: {
                      entityType: 'metric_value',
                      origin: 176266263.42,
                    },
                  },
                  {
                    type: 'text',
                    value: '，',
                  },
                  {
                    type: 'text',
                    value: '环比',
                  },
                  {
                    type: 'text',
                    value: ' ',
                  },
                  {
                    type: 'custom',
                    metadata: {
                      customType: 'custom_delta_value',
                      diff: 30003489.72,
                      compare: 146262773.7,
                      current: 176266263.42,
                    },
                  },
                  {
                    type: 'text',
                    value: '，变化率 ',
                  },
                  {
                    type: 'entity',
                    value: '20.5%',
                    metadata: {
                      entityType: 'ratio_value',
                      origin: 0.2051341497293101,
                      assessment: 'positive',
                    },
                  },
                  {
                    type: 'text',
                    value: '。',
                  },
                ],
                className: 'overview',
              },
              {
                type: 'normal',
                phrases: [
                  {
                    type: 'text',
                    value: '波动主要影响因素：',
                  },
                ],
                className: 'summary-title',
              },
              {
                type: 'bullets',
                className: 'summary-detail',
                isOrder: true,
                bullets: [
                  {
                    type: 'bullet-item',
                    phrases: [
                      {
                        type: 'entity',
                        value: '数量',
                        metadata: {
                          entityType: 'metric_name',
                        },
                      },
                      {
                        type: 'text',
                        value: '，变化差值 ',
                      },
                      {
                        type: 'custom',
                        metadata: {
                          customType: 'custom_delta_value',
                          diff: 48291,
                          compare: 46191678,
                          current: 46239969,
                        },
                      },
                      {
                        type: 'text',
                        value: '，变化率 ',
                      },
                      {
                        type: 'entity',
                        value: '0.10%',
                        metadata: {
                          entityType: 'ratio_value',
                          origin: 0.001045448056682418,
                          assessment: 'positive',
                        },
                      },
                      {
                        type: 'text',
                        value: '，对整体波动贡献度是 ',
                      },
                      {
                        type: 'entity',
                        value: '105.86%',
                        metadata: {
                          entityType: 'contribute_ratio',
                          origin: 1.0586254595355833,
                        },
                      },
                      {
                        type: 'text',
                        value: ' ',
                      },
                      {
                        type: 'custom',
                        metadata: {
                          customType: 'drill_down_dims',
                          dims: [
                            {
                              queryFieldName: '物流方式',
                              queryFieldId: '19155f3f-83ac-4364-91e3-2cda45f8a015',
                              fieldName: '物流方式',
                              fieldId: 'D2020120800161505000000674977',
                            },
                            {
                              queryFieldName: '商品子类别',
                              queryFieldId: 'f903b673-1ece-4b84-8984-f0c7d49e5940',
                              fieldName: '商品子类别',
                              fieldId: 'D2020120800161505000000674983',
                            },
                            {
                              queryFieldName: '销售渠道',
                              queryFieldId: '6a8af850-5b84-4c4d-9201-99e87d13e77f',
                              fieldName: '销售渠道',
                              fieldId: 'D2020120800161505000000674974',
                            },
                          ],
                        },
                      },
                      {
                        type: 'text',
                        value: '。',
                      },
                    ],
                    subBullet: {
                      type: 'bullets',
                      isOrder: true,
                      bullets: [
                        {
                          type: 'bullet-item',
                          phrases: [
                            {
                              type: 'entity',
                              value: '商品子类别 = 便签纸',
                              metadata: {
                                entityType: 'dim_value',
                              },
                            },
                            {
                              type: 'text',
                              value: '，变化差值 ',
                            },
                            {
                              type: 'custom',
                              metadata: {
                                customType: 'custom_delta_value',
                                diff: 202012,
                                compare: 4053110,
                                current: 4255122,
                              },
                            },
                            {
                              type: 'text',
                              value: '，变化率 ',
                            },
                            {
                              type: 'entity',
                              value: '4.98%',
                              metadata: {
                                entityType: 'ratio_value',
                                origin: 0.04984123302846456,
                                assessment: 'positive',
                              },
                            },
                            {
                              type: 'text',
                              value: '，对整体波动贡献度是 ',
                            },
                            {
                              type: 'entity',
                              value: '442.85%',
                              metadata: {
                                entityType: 'contribute_ratio',
                                origin: 4.428465890780937,
                              },
                            },
                            {
                              type: 'text',
                              value: ' ',
                            },
                            {
                              type: 'custom',
                              metadata: {
                                customType: 'drill_down_dims',
                                dims: [
                                  {
                                    queryFieldName: '物流方式',
                                    queryFieldId: '19155f3f-83ac-4364-91e3-2cda45f8a015',
                                    fieldName: '物流方式',
                                    fieldId: 'D2020120800161505000000674977',
                                  },
                                  {
                                    queryFieldName: '商品子类别',
                                    queryFieldId: 'f903b673-1ece-4b84-8984-f0c7d49e5940',
                                    fieldName: '商品子类别',
                                    fieldId: 'D2020120800161505000000674983',
                                  },
                                  {
                                    queryFieldName: '销售渠道',
                                    queryFieldId: '6a8af850-5b84-4c4d-9201-99e87d13e77f',
                                    fieldName: '销售渠道',
                                    fieldId: 'D2020120800161505000000674974',
                                  },
                                ],
                              },
                            },
                            {
                              type: 'text',
                              value: '。',
                            },
                          ],
                        },
                        {
                          type: 'bullet-item',
                          phrases: [
                            {
                              type: 'entity',
                              value: '商品子类别 = 纸张',
                              metadata: {
                                entityType: 'dim_value',
                              },
                            },
                            {
                              type: 'text',
                              value: '，变化差值 ',
                            },
                            {
                              type: 'custom',
                              metadata: {
                                customType: 'custom_delta_value',
                                diff: 163035,
                                compare: 3964794,
                                current: 4127829,
                              },
                            },
                            {
                              type: 'text',
                              value: '，变化率 ',
                            },
                            {
                              type: 'entity',
                              value: '4.11%',
                              metadata: {
                                entityType: 'ratio_value',
                                origin: 0.04112067360876757,
                                assessment: 'positive',
                              },
                            },
                            {
                              type: 'text',
                              value: '，对整体波动贡献度是 ',
                            },
                            {
                              type: 'entity',
                              value: '357.40%',
                              metadata: {
                                entityType: 'contribute_ratio',
                                origin: 3.5740200409058382,
                              },
                            },
                            {
                              type: 'text',
                              value: ' ',
                            },
                            {
                              type: 'custom',
                              metadata: {
                                customType: 'drill_down_dims',
                                dims: [
                                  {
                                    queryFieldName: '物流方式',
                                    queryFieldId: '19155f3f-83ac-4364-91e3-2cda45f8a015',
                                    fieldName: '物流方式',
                                    fieldId: 'D2020120800161505000000674977',
                                  },
                                  {
                                    queryFieldName: '商品子类别',
                                    queryFieldId: 'f903b673-1ece-4b84-8984-f0c7d49e5940',
                                    fieldName: '商品子类别',
                                    fieldId: 'D2020120800161505000000674983',
                                  },
                                  {
                                    queryFieldName: '销售渠道',
                                    queryFieldId: '6a8af850-5b84-4c4d-9201-99e87d13e77f',
                                    fieldName: '销售渠道',
                                    fieldId: 'D2020120800161505000000674974',
                                  },
                                ],
                              },
                            },
                            {
                              type: 'text',
                              value: '。',
                            },
                          ],
                        },
                        {
                          type: 'bullet-item',
                          phrases: [
                            {
                              type: 'entity',
                              value: '商品子类别 = 本子',
                              metadata: {
                                entityType: 'dim_value',
                              },
                            },
                            {
                              type: 'text',
                              value: '，变化差值 ',
                            },
                            {
                              type: 'custom',
                              metadata: {
                                customType: 'custom_delta_value',
                                diff: -161386,
                                compare: 4242152,
                                current: 4080766,
                              },
                            },
                            {
                              type: 'text',
                              value: '，变化率 ',
                            },
                            {
                              type: 'entity',
                              value: '3.80%',
                              metadata: {
                                entityType: 'ratio_value',
                                origin: -0.03804342701534504,
                                assessment: 'negative',
                              },
                            },
                            {
                              type: 'text',
                              value: '，对整体波动贡献度是 ',
                            },
                            {
                              type: 'entity',
                              value: '-353.79%',
                              metadata: {
                                entityType: 'contribute_ratio',
                                origin: -3.5378709989979424,
                              },
                            },
                            {
                              type: 'text',
                              value: ' ',
                            },
                            {
                              type: 'custom',
                              metadata: {
                                customType: 'drill_down_dims',
                                dims: [
                                  {
                                    queryFieldName: '物流方式',
                                    queryFieldId: '19155f3f-83ac-4364-91e3-2cda45f8a015',
                                    fieldName: '物流方式',
                                    fieldId: 'D2020120800161505000000674977',
                                  },
                                  {
                                    queryFieldName: '商品子类别',
                                    queryFieldId: 'f903b673-1ece-4b84-8984-f0c7d49e5940',
                                    fieldName: '商品子类别',
                                    fieldId: 'D2020120800161505000000674983',
                                  },
                                  {
                                    queryFieldName: '销售渠道',
                                    queryFieldId: '6a8af850-5b84-4c4d-9201-99e87d13e77f',
                                    fieldName: '销售渠道',
                                    fieldId: 'D2020120800161505000000674974',
                                  },
                                ],
                              },
                            },
                            {
                              type: 'text',
                              value: '。',
                            },
                          ],
                        },
                        {
                          type: 'bullet-item',
                          phrases: [
                            {
                              type: 'entity',
                              value: '销售渠道 = 沃尔玛',
                              metadata: {
                                entityType: 'dim_value',
                              },
                            },
                            {
                              type: 'text',
                              value: '，变化差值 ',
                            },
                            {
                              type: 'custom',
                              metadata: {
                                customType: 'custom_delta_value',
                                diff: -143696,
                                compare: 6685872,
                                current: 6542176,
                              },
                            },
                            {
                              type: 'text',
                              value: '，变化率 ',
                            },
                            {
                              type: 'entity',
                              value: '2.15%',
                              metadata: {
                                entityType: 'ratio_value',
                                origin: -0.02149248445079415,
                                assessment: 'negative',
                              },
                            },
                            {
                              type: 'text',
                              value: '，对整体波动贡献度是 ',
                            },
                            {
                              type: 'entity',
                              value: '-315.01%',
                              metadata: {
                                entityType: 'contribute_ratio',
                                origin: -3.15007442449784,
                              },
                            },
                            {
                              type: 'text',
                              value: ' ',
                            },
                            {
                              type: 'custom',
                              metadata: {
                                customType: 'drill_down_dims',
                                dims: [
                                  {
                                    queryFieldName: '物流方式',
                                    queryFieldId: '19155f3f-83ac-4364-91e3-2cda45f8a015',
                                    fieldName: '物流方式',
                                    fieldId: 'D2020120800161505000000674977',
                                  },
                                  {
                                    queryFieldName: '商品子类别',
                                    queryFieldId: 'f903b673-1ece-4b84-8984-f0c7d49e5940',
                                    fieldName: '商品子类别',
                                    fieldId: 'D2020120800161505000000674983',
                                  },
                                  {
                                    queryFieldName: '销售渠道',
                                    queryFieldId: '6a8af850-5b84-4c4d-9201-99e87d13e77f',
                                    fieldName: '销售渠道',
                                    fieldId: 'D2020120800161505000000674974',
                                  },
                                ],
                              },
                            },
                            {
                              type: 'text',
                              value: '。',
                            },
                          ],
                        },
                        {
                          type: 'bullet-item',
                          phrases: [
                            {
                              type: 'entity',
                              value: '销售渠道 = 家乐福',
                              metadata: {
                                entityType: 'dim_value',
                              },
                            },
                            {
                              type: 'text',
                              value: '，变化差值 ',
                            },
                            {
                              type: 'custom',
                              metadata: {
                                customType: 'custom_delta_value',
                                diff: 142394,
                                compare: 6531961,
                                current: 6674355,
                              },
                            },
                            {
                              type: 'text',
                              value: '，变化率 ',
                            },
                            {
                              type: 'entity',
                              value: '2.18%',
                              metadata: {
                                entityType: 'ratio_value',
                                origin: 0.021799579023818422,
                                assessment: 'positive',
                              },
                            },
                            {
                              type: 'text',
                              value: '，对整体波动贡献度是 ',
                            },
                            {
                              type: 'entity',
                              value: '312.15%',
                              metadata: {
                                entityType: 'contribute_ratio',
                                origin: 3.121532245865893,
                              },
                            },
                            {
                              type: 'text',
                              value: ' ',
                            },
                            {
                              type: 'custom',
                              metadata: {
                                customType: 'drill_down_dims',
                                dims: [
                                  {
                                    queryFieldName: '物流方式',
                                    queryFieldId: '19155f3f-83ac-4364-91e3-2cda45f8a015',
                                    fieldName: '物流方式',
                                    fieldId: 'D2020120800161505000000674977',
                                  },
                                  {
                                    queryFieldName: '商品子类别',
                                    queryFieldId: 'f903b673-1ece-4b84-8984-f0c7d49e5940',
                                    fieldName: '商品子类别',
                                    fieldId: 'D2020120800161505000000674983',
                                  },
                                  {
                                    queryFieldName: '销售渠道',
                                    queryFieldId: '6a8af850-5b84-4c4d-9201-99e87d13e77f',
                                    fieldName: '销售渠道',
                                    fieldId: 'D2020120800161505000000674974',
                                  },
                                ],
                              },
                            },
                            {
                              type: 'text',
                              value: '。',
                            },
                          ],
                        },
                      ],
                    },
                  },
                  {
                    type: 'bullet-item',
                    phrases: [
                      {
                        type: 'entity',
                        value: '折扣',
                        metadata: {
                          entityType: 'metric_name',
                        },
                      },
                      {
                        type: 'text',
                        value: '，变化差值 ',
                      },
                      {
                        type: 'custom',
                        metadata: {
                          customType: 'custom_delta_value',
                          diff: -2674.300000000003,
                          compare: 40479.32,
                          current: 37805.02,
                        },
                      },
                      {
                        type: 'text',
                        value: '，变化率 ',
                      },
                      {
                        type: 'entity',
                        value: '6.61%',
                        metadata: {
                          entityType: 'ratio_value',
                          origin: -0.06606583312170271,
                          assessment: 'negative',
                        },
                      },
                      {
                        type: 'text',
                        value: '，对整体波动贡献度是 ',
                      },
                      {
                        type: 'entity',
                        value: '-5.86%',
                        metadata: {
                          entityType: 'contribute_ratio',
                          origin: -0.058625459535648745,
                        },
                      },
                      {
                        type: 'text',
                        value: ' ',
                      },
                      {
                        type: 'custom',
                        metadata: {
                          customType: 'drill_down_dims',
                          dims: [
                            {
                              queryFieldName: '物流方式',
                              queryFieldId: '19155f3f-83ac-4364-91e3-2cda45f8a015',
                              fieldName: '物流方式',
                              fieldId: 'D2020120800161505000000674977',
                            },
                            {
                              queryFieldName: '商品子类别',
                              queryFieldId: 'f903b673-1ece-4b84-8984-f0c7d49e5940',
                              fieldName: '商品子类别',
                              fieldId: 'D2020120800161505000000674983',
                            },
                            {
                              queryFieldName: '销售渠道',
                              queryFieldId: '6a8af850-5b84-4c4d-9201-99e87d13e77f',
                              fieldName: '销售渠道',
                              fieldId: 'D2020120800161505000000674974',
                            },
                          ],
                        },
                      },
                      {
                        type: 'text',
                        value: '。',
                      },
                    ],
                    subBullet: {
                      type: 'bullets',
                      isOrder: true,
                      bullets: [
                        {
                          type: 'bullet-item',
                          phrases: [
                            {
                              type: 'entity',
                              value: '商品子类别 = 收纳具',
                              metadata: {
                                entityType: 'dim_value',
                              },
                            },
                            {
                              type: 'text',
                              value: '，变化差值 ',
                            },
                            {
                              type: 'custom',
                              metadata: {
                                customType: 'custom_delta_value',
                                diff: -1977.35,
                                compare: 3460.33,
                                current: 1482.98,
                              },
                            },
                            {
                              type: 'text',
                              value: '，变化率 ',
                            },
                            {
                              type: 'entity',
                              value: '57.14%',
                              metadata: {
                                entityType: 'ratio_value',
                                origin: -0.5714339383815994,
                                assessment: 'negative',
                              },
                            },
                            {
                              type: 'text',
                              value: '，对整体波动贡献度是 ',
                            },
                            {
                              type: 'entity',
                              value: '-4.33%',
                              metadata: {
                                entityType: 'contribute_ratio',
                                origin: -0.0433470636850073,
                              },
                            },
                            {
                              type: 'text',
                              value: ' ',
                            },
                            {
                              type: 'custom',
                              metadata: {
                                customType: 'drill_down_dims',
                                dims: [
                                  {
                                    queryFieldName: '物流方式',
                                    queryFieldId: '19155f3f-83ac-4364-91e3-2cda45f8a015',
                                    fieldName: '物流方式',
                                    fieldId: 'D2020120800161505000000674977',
                                  },
                                  {
                                    queryFieldName: '商品子类别',
                                    queryFieldId: 'f903b673-1ece-4b84-8984-f0c7d49e5940',
                                    fieldName: '商品子类别',
                                    fieldId: 'D2020120800161505000000674983',
                                  },
                                  {
                                    queryFieldName: '销售渠道',
                                    queryFieldId: '6a8af850-5b84-4c4d-9201-99e87d13e77f',
                                    fieldName: '销售渠道',
                                    fieldId: 'D2020120800161505000000674974',
                                  },
                                ],
                              },
                            },
                            {
                              type: 'text',
                              value: '。',
                            },
                          ],
                        },
                        {
                          type: 'bullet-item',
                          phrases: [
                            {
                              type: 'entity',
                              value: '商品子类别 = 柜子',
                              metadata: {
                                entityType: 'dim_value',
                              },
                            },
                            {
                              type: 'text',
                              value: '，变化差值 ',
                            },
                            {
                              type: 'custom',
                              metadata: {
                                customType: 'custom_delta_value',
                                diff: 807.67,
                                compare: 2075.56,
                                current: 2883.23,
                              },
                            },
                            {
                              type: 'text',
                              value: '，变化率 ',
                            },
                            {
                              type: 'entity',
                              value: '38.91%',
                              metadata: {
                                entityType: 'ratio_value',
                                origin: 0.3891335350459635,
                                assessment: 'positive',
                              },
                            },
                            {
                              type: 'text',
                              value: '，对整体波动贡献度是 ',
                            },
                            {
                              type: 'entity',
                              value: '1.77%',
                              metadata: {
                                entityType: 'contribute_ratio',
                                origin: 0.017705577124166105,
                              },
                            },
                            {
                              type: 'text',
                              value: ' ',
                            },
                            {
                              type: 'custom',
                              metadata: {
                                customType: 'drill_down_dims',
                                dims: [
                                  {
                                    queryFieldName: '物流方式',
                                    queryFieldId: '19155f3f-83ac-4364-91e3-2cda45f8a015',
                                    fieldName: '物流方式',
                                    fieldId: 'D2020120800161505000000674977',
                                  },
                                  {
                                    queryFieldName: '商品子类别',
                                    queryFieldId: 'f903b673-1ece-4b84-8984-f0c7d49e5940',
                                    fieldName: '商品子类别',
                                    fieldId: 'D2020120800161505000000674983',
                                  },
                                  {
                                    queryFieldName: '销售渠道',
                                    queryFieldId: '6a8af850-5b84-4c4d-9201-99e87d13e77f',
                                    fieldName: '销售渠道',
                                    fieldId: 'D2020120800161505000000674974',
                                  },
                                ],
                              },
                            },
                            {
                              type: 'text',
                              value: '。',
                            },
                          ],
                        },
                        {
                          type: 'bullet-item',
                          phrases: [
                            {
                              type: 'entity',
                              value: '商品子类别 = 电话',
                              metadata: {
                                entityType: 'dim_value',
                              },
                            },
                            {
                              type: 'text',
                              value: '，变化差值 ',
                            },
                            {
                              type: 'custom',
                              metadata: {
                                customType: 'custom_delta_value',
                                diff: 552.12,
                                compare: 1707.25,
                                current: 2259.37,
                              },
                            },
                            {
                              type: 'text',
                              value: '，变化率 ',
                            },
                            {
                              type: 'entity',
                              value: '32.34%',
                              metadata: {
                                entityType: 'ratio_value',
                                origin: 0.3233972763215698,
                                assessment: 'positive',
                              },
                            },
                            {
                              type: 'text',
                              value: '，对整体波动贡献度是 ',
                            },
                            {
                              type: 'entity',
                              value: '1.21%',
                              metadata: {
                                entityType: 'contribute_ratio',
                                origin: 0.012103462109270607,
                              },
                            },
                            {
                              type: 'text',
                              value: ' ',
                            },
                            {
                              type: 'custom',
                              metadata: {
                                customType: 'drill_down_dims',
                                dims: [
                                  {
                                    queryFieldName: '物流方式',
                                    queryFieldId: '19155f3f-83ac-4364-91e3-2cda45f8a015',
                                    fieldName: '物流方式',
                                    fieldId: 'D2020120800161505000000674977',
                                  },
                                  {
                                    queryFieldName: '商品子类别',
                                    queryFieldId: 'f903b673-1ece-4b84-8984-f0c7d49e5940',
                                    fieldName: '商品子类别',
                                    fieldId: 'D2020120800161505000000674983',
                                  },
                                  {
                                    queryFieldName: '销售渠道',
                                    queryFieldId: '6a8af850-5b84-4c4d-9201-99e87d13e77f',
                                    fieldName: '销售渠道',
                                    fieldId: 'D2020120800161505000000674974',
                                  },
                                ],
                              },
                            },
                            {
                              type: 'text',
                              value: '。',
                            },
                          ],
                        },
                        {
                          type: 'bullet-item',
                          phrases: [
                            {
                              type: 'entity',
                              value: '商品子类别 = 笔',
                              metadata: {
                                entityType: 'dim_value',
                              },
                            },
                            {
                              type: 'text',
                              value: '，变化差值 ',
                            },
                            {
                              type: 'custom',
                              metadata: {
                                customType: 'custom_delta_value',
                                diff: -539.2,
                                compare: 2327.47,
                                current: 1788.27,
                              },
                            },
                            {
                              type: 'text',
                              value: '，变化率 ',
                            },
                            {
                              type: 'entity',
                              value: '23.17%',
                              metadata: {
                                entityType: 'ratio_value',
                                origin: -0.23166786252884036,
                                assessment: 'negative',
                              },
                            },
                            {
                              type: 'text',
                              value: '，对整体波动贡献度是 ',
                            },
                            {
                              type: 'entity',
                              value: '-1.18%',
                              metadata: {
                                entityType: 'contribute_ratio',
                                origin: -0.011820232502569571,
                              },
                            },
                            {
                              type: 'text',
                              value: ' ',
                            },
                            {
                              type: 'custom',
                              metadata: {
                                customType: 'drill_down_dims',
                                dims: [
                                  {
                                    queryFieldName: '物流方式',
                                    queryFieldId: '19155f3f-83ac-4364-91e3-2cda45f8a015',
                                    fieldName: '物流方式',
                                    fieldId: 'D2020120800161505000000674977',
                                  },
                                  {
                                    queryFieldName: '商品子类别',
                                    queryFieldId: 'f903b673-1ece-4b84-8984-f0c7d49e5940',
                                    fieldName: '商品子类别',
                                    fieldId: 'D2020120800161505000000674983',
                                  },
                                  {
                                    queryFieldName: '销售渠道',
                                    queryFieldId: '6a8af850-5b84-4c4d-9201-99e87d13e77f',
                                    fieldName: '销售渠道',
                                    fieldId: 'D2020120800161505000000674974',
                                  },
                                ],
                              },
                            },
                            {
                              type: 'text',
                              value: '。',
                            },
                          ],
                        },
                        {
                          type: 'bullet-item',
                          phrases: [
                            {
                              type: 'entity',
                              value: '商品子类别 = 信封',
                              metadata: {
                                entityType: 'dim_value',
                              },
                            },
                            {
                              type: 'text',
                              value: '，变化差值 ',
                            },
                            {
                              type: 'custom',
                              metadata: {
                                customType: 'custom_delta_value',
                                diff: -451.55,
                                compare: 2549.27,
                                current: 2097.72,
                              },
                            },
                            {
                              type: 'text',
                              value: '，变化率 ',
                            },
                            {
                              type: 'entity',
                              value: '17.71%',
                              metadata: {
                                entityType: 'ratio_value',
                                origin: -0.1771291389299682,
                                assessment: 'negative',
                              },
                            },
                            {
                              type: 'text',
                              value: '，对整体波动贡献度是 ',
                            },
                            {
                              type: 'entity',
                              value: '-0.99%',
                              metadata: {
                                entityType: 'contribute_ratio',
                                origin: -0.009898787067016487,
                              },
                            },
                            {
                              type: 'text',
                              value: ' ',
                            },
                            {
                              type: 'custom',
                              metadata: {
                                customType: 'drill_down_dims',
                                dims: [
                                  {
                                    queryFieldName: '物流方式',
                                    queryFieldId: '19155f3f-83ac-4364-91e3-2cda45f8a015',
                                    fieldName: '物流方式',
                                    fieldId: 'D2020120800161505000000674977',
                                  },
                                  {
                                    queryFieldName: '商品子类别',
                                    queryFieldId: 'f903b673-1ece-4b84-8984-f0c7d49e5940',
                                    fieldName: '商品子类别',
                                    fieldId: 'D2020120800161505000000674983',
                                  },
                                  {
                                    queryFieldName: '销售渠道',
                                    queryFieldId: '6a8af850-5b84-4c4d-9201-99e87d13e77f',
                                    fieldName: '销售渠道',
                                    fieldId: 'D2020120800161505000000674974',
                                  },
                                ],
                              },
                            },
                            {
                              type: 'text',
                              value: '。',
                            },
                          ],
                        },
                      ],
                    },
                  },
                ],
              },
            ],
          },
        ],
      })
    );
  });
});
