/* eslint-disable no-template-curly-in-string */
import React, { useState, useEffect } from 'react';

import { Skeleton, Switch, Divider, Tooltip, Popover, Checkbox } from 'antd';
// import { PlusOutlined, MinusOutlined } from '@ant-design/icons';
import numeral from 'numeral';

import {
  NarrativeTextVis,
  NtvPluginManager,
  createCustomPhraseFactory,
  seedToken,
} from '../../../../packages/ava-react/src';
import { generateTextSpec, NarrativeTextSpec } from '../../../../packages/ava/lib';

import fluctuationData from './mock-data';

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

const templateSpec = generateTextSpec({
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
});

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
  variable: {
    ...fluctuationData,
  },
});

const bulletCollapseSpec: NarrativeTextSpec = {
  sections: [
    {
      paragraphs: [
        {
          type: 'bullets',
          isOrder: true,
          key: 'bullet',
          bullets: new Array(3).fill(0).map((_, outIndex) => ({
            type: 'bullet-item',
            key: `${outIndex}`,
            phrases: [
              {
                type: 'text',
                value: `这是第 ${outIndex + 1} 个`,
              },
            ],
            subBullet: {
              type: 'bullets',
              isOrder: false,
              bullets: new Array(2).fill(0).map((_, innerIndex) => ({
                type: 'bullet-item',
                key: `${outIndex}-${innerIndex}`,
                phrases: [
                  {
                    type: 'text',
                    value: `${outIndex + 1} - ${innerIndex + 1}`,
                  },
                ],
                subBullet: {
                  type: 'bullets',
                  isOrder: true,
                  bullets: new Array(2).fill(0).map((_, threeIndex) => ({
                    type: 'bullet-item',
                    key: `${outIndex}-${innerIndex}-${threeIndex}`,
                    phrases: [
                      {
                        type: 'text',
                        value: `hhhhhh ${outIndex + 1} - ${innerIndex + 1} - ${threeIndex}`,
                      },
                    ],
                  })),
                },
              })),
            },
          })),
        },
      ],
    },
  ],
};

const App = () => {
  const [loading, setLoading] = useState(true);
  const [isSmall, setIsSmall] = useState(false);
  const [spec, setSpec] = useState({});
  const [collapsedKeys, setCollapsedKeys] = useState<string[]>(['0', '0-1', '1-0']);

  useEffect(() => {
    fetch('https://assets.antv.antgroup.com/ava/ntv-booking.json')
      .then((res) => res.json())
      .then((res) => {
        setSpec(res);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('collapsedKeys: ', collapsedKeys);
  }, [collapsedKeys]);

  return (
    <>
      <Switch checked={isSmall} onChange={setIsSmall} checkedChildren="Small" unCheckedChildren="Normal" />
      {loading ? <Skeleton active /> : <NarrativeTextVis spec={spec} size={isSmall ? 'small' : 'normal'} />}
      <NarrativeTextVis
        spec={bulletCollapseSpec}
        showCollapse={{
          // 调试代码注释
          showBulletsLine: false,
          // switcherIcon: (collapsed) => (!collapsed ? <MinusOutlined /> : <PlusOutlined />),
          collapsedKeys,
          onCollapsed: setCollapsedKeys,
        }}
        size={isSmall ? 'small' : 'normal'}
      />
      <Divider />
      <NarrativeTextVis spec={templateSpec} />
      <Divider />
      <NarrativeTextVis spec={fluctuationSpec} pluginManager={ntvPluginManager} />
      <Divider>转义字符</Divider>
      <NarrativeTextVis
        spec={{
          sections: [
            {
              paragraphs: [
                {
                  type: 'normal',
                  phrases: [
                    {
                      type: 'text',
                      value: '在 text 中的转义字符字符 \r\n 无效，后面是 escape 类型短语，换行：',
                    },
                    {
                      type: 'escape',
                      value: '\n',
                    },
                    {
                      type: 'text',
                      value: '回车',
                    },
                    {
                      type: 'escape',
                      value: '\r',
                    },
                  ],
                },
              ],
            },
          ],
        }}
      />
      <Divider>公式</Divider>
      <NarrativeTextVis
        spec={{
          sections: [
            {
              paragraphs: [
                {
                  type: 'normal',
                  phrases: [
                    {
                      type: 'text',
                      value: '渲染公式：',
                    },
                    {
                      type: 'formula',
                      // eslint-disable-next-line no-useless-escape, quotes
                      value: `c = \\pm\\sqrt{a^2 + b^2}`,
                      className: 'my-formula',
                      styles: {
                        color: 'red',
                      },
                    },
                  ],
                },
              ],
            },
          ],
        }}
      />
    </>
  );
};

export default <App />;
