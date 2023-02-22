/* eslint-disable no-template-curly-in-string */
import React from 'react';

import ReactDOM from 'react-dom';
import { Tooltip, Popover, Checkbox } from 'antd';
import { generateTextSpec } from '@antv/ava';
import { NarrativeTextVis, NtvPluginManager, createCustomPhraseFactory, seedToken } from '@antv/ava-react';
import numeral from 'numeral';

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

const customDeltaValue = createCustomPhraseFactory({
  key: 'custom_delta_value',
  content: (value: string, metadata: any) => {
    return (
      <Tooltip title={metadata.diff}>
        <span
          style={{
            color: metadata.diff > 0 ? seedToken.colorPositive : seedToken.colorNegative,
          }}
        >
          {`${metadata.diff > 0 ? '+' : '-'}${numeral(Math.abs(metadata.diff)).format('0.0a')}（${numeral(
            metadata.compare
          ).format('0.0a')} ➝ ${numeral(metadata.current).format('0.0a')}）`}
        </span>
      </Tooltip>
    );
  },
});

const drillDownDims = createCustomPhraseFactory({
  key: 'drill_down_dims',
  content: (value: string, metadata: any) => {
    return (
      <Popover
        placement="right"
        content={
          <Checkbox.Group
            options={metadata.dims.map((item: any) => ({
              label: item.queryFieldName,
              value: item.queryFieldId,
            }))}
          />
        }
      >
        <span style={{ color: 'blue' }}>继续归因</span>
      </Popover>
    );
  },
});

const ntvPluginManager = new NtvPluginManager([customDeltaValue, drillDownDims]);

const fluctuationSpec = generateTextSpec({
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
  variable: fluctuationData,
});

const App = () => {
  return <NarrativeTextVis pluginManager={ntvPluginManager} spec={fluctuationSpec} />;
};

ReactDOM.render(<App />, document.getElementById('container'));
