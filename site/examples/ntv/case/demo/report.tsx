import React from 'react';

import ReactDOM from 'react-dom';
import { NarrativeTextVis } from '@antv/ava-react';

import type { NtvTypes } from '@antv/ava-react';

// TODO fetch data later
const spec: NtvTypes.NarrativeTextSpec = {
  headline: {
    type: 'headline',
    phrases: [{ type: 'text', value: '业务简报' }],
  },
  sections: [
    {
      paragraphs: [
        {
          type: 'normal',
          phrases: [
            {
              type: 'text',
              value: '本月销售情况如下：',
            },
          ],
        },
        {
          type: 'normal',
          phrases: [
            {
              type: 'entity',
              value: '数量',
              metadata: {
                entityType: 'metric_name',
              },
            },
            {
              type: 'entity',
              value: '1.98亿',
              metadata: {
                entityType: 'metric_value',
                origin: 197715755,
              },
            },
            {
              type: 'text',
              value: '，',
            },
            {
              type: 'text',
              value: '同比',
            },
            {
              type: 'text',
              value: '上月',
            },
            {
              type: 'text',
              value: '同期',
            },
            {
              type: 'entity',
              value: '1,302.76万',
              metadata: {
                entityType: 'delta_value',
                assessment: 'positive',
                origin: 13027627,
              },
            },
            {
              type: 'text',
              value: '(',
            },
            {
              type: 'entity',
              value: '7.05%',
              metadata: {
                entityType: 'ratio_value',
                assessment: 'positive',
                origin: 0.07053851885920896,
              },
            },
            {
              type: 'text',
              value: ')',
            },
            {
              type: 'text',
              value: '，',
            },
            {
              type: 'text',
              value: '近3个月',
            },
            {
              type: 'text',
              value: '趋势',
            },
            {
              type: 'text',
              value: '波动下降',
            },
            {
              type: 'text',
              value: '（环比率：',
            },
            {
              type: 'entity',
              value: '-3.50%',
              metadata: {
                entityType: 'other_metric_value',
              },
            },
            {
              type: 'text',
              value: '/',
            },
            {
              type: 'entity',
              value: '0.22%',
              metadata: {
                entityType: 'other_metric_value',
              },
            },
            {
              type: 'text',
              value: '/',
            },
            {
              type: 'entity',
              value: '5.66%',
              metadata: {
                entityType: 'other_metric_value',
              },
            },
            {
              type: 'text',
              value: '），相对去年',
            },
            {
              type: 'text',
              value: '持续下降',
            },
            {
              type: 'text',
              value: '（年同比率：',
            },
            {
              type: 'entity',
              value: '-0.18%',
              metadata: {
                entityType: 'other_metric_value',
              },
            },
            {
              type: 'text',
              value: '/',
            },
            {
              type: 'entity',
              value: '-3.16%',
              metadata: {
                entityType: 'other_metric_value',
              },
            },
            {
              type: 'text',
              value: '/',
            },
            {
              type: 'entity',
              value: '-0.11%',
              metadata: {
                entityType: 'other_metric_value',
              },
            },
            {
              type: 'text',
              value: '）',
            },
          ],
        },
        {
          type: 'normal',
          phrases: [
            {
              type: 'text',
              value: '从',
            },
            {
              type: 'text',
              value: '商品类别',
            },
            {
              type: 'text',
              value: '来看',
            },
          ],
        },
        {
          type: 'bullets',
          isOrder: false,
          bullets: [
            {
              type: 'bullet-item',
              phrases: [
                {
                  type: 'entity',
                  value: '办公用品',
                  metadata: {
                    entityType: 'dim_value',
                  },
                },
                {
                  type: 'text',
                  value: '：',
                },
                {
                  type: 'entity',
                  value: '数量',
                  metadata: {
                    entityType: 'metric_name',
                  },
                },
                {
                  type: 'entity',
                  value: '1.59亿',
                  metadata: {
                    entityType: 'metric_value',
                    origin: 159101246,
                  },
                },
                {
                  type: 'text',
                  value: '（占比',
                },
                {
                  type: 'entity',
                  value: '80.47%',
                  metadata: {
                    entityType: 'proportion',
                    origin: 0.8047,
                  },
                },
                {
                  type: 'text',
                  value: '）',
                },
                {
                  type: 'text',
                  value: '，',
                },
                {
                  type: 'text',
                  value: '同比',
                },
                {
                  type: 'text',
                  value: '上月',
                },
                {
                  type: 'text',
                  value: '同期',
                },
                {
                  type: 'entity',
                  value: '1,058.96万',
                  metadata: {
                    entityType: 'delta_value',
                    assessment: 'positive',
                    origin: 10589604,
                  },
                },
                {
                  type: 'text',
                  value: '(',
                },
                {
                  type: 'entity',
                  value: '7.13%',
                  metadata: {
                    entityType: 'ratio_value',
                    assessment: 'positive',
                    origin: 0.071304874536368,
                  },
                },
                {
                  type: 'text',
                  value: ')',
                },
                {
                  type: 'text',
                  value: '； ',
                },
              ],
            },
            {
              type: 'bullet-item',
              phrases: [
                {
                  type: 'entity',
                  value: '家具',
                  metadata: {
                    entityType: 'dim_value',
                  },
                },
                {
                  type: 'text',
                  value: '：',
                },
                {
                  type: 'entity',
                  value: '数量',
                  metadata: {
                    entityType: 'metric_name',
                  },
                },
                {
                  type: 'entity',
                  value: '3,507.16万',
                  metadata: {
                    entityType: 'metric_value',
                    origin: 35071592,
                  },
                },
                {
                  type: 'text',
                  value: '（占比',
                },
                {
                  type: 'entity',
                  value: '17.74%',
                  metadata: {
                    entityType: 'proportion',
                    origin: 0.1774,
                  },
                },
                {
                  type: 'text',
                  value: '）',
                },
                {
                  type: 'text',
                  value: '，',
                },
                {
                  type: 'text',
                  value: '同比',
                },
                {
                  type: 'text',
                  value: '上月',
                },
                {
                  type: 'text',
                  value: '同期',
                },
                {
                  type: 'entity',
                  value: '220.05万',
                  metadata: {
                    entityType: 'delta_value',
                    assessment: 'positive',
                    origin: 2200501,
                  },
                },
                {
                  type: 'text',
                  value: '(',
                },
                {
                  type: 'entity',
                  value: '6.69%',
                  metadata: {
                    entityType: 'ratio_value',
                    assessment: 'positive',
                    origin: 0.06694335153037664,
                  },
                },
                {
                  type: 'text',
                  value: ')',
                },
                {
                  type: 'text',
                  value: '； ',
                },
              ],
            },
            {
              type: 'bullet-item',
              phrases: [
                {
                  type: 'entity',
                  value: '设备',
                  metadata: {
                    entityType: 'dim_value',
                  },
                },
                {
                  type: 'text',
                  value: '：',
                },
                {
                  type: 'entity',
                  value: '数量',
                  metadata: {
                    entityType: 'metric_name',
                  },
                },
                {
                  type: 'entity',
                  value: '354.29万',
                  metadata: {
                    entityType: 'metric_value',
                    origin: 3542917,
                  },
                },
                {
                  type: 'text',
                  value: '（占比',
                },
                {
                  type: 'entity',
                  value: '1.79%',
                  metadata: {
                    entityType: 'proportion',
                    origin: 0.0179,
                  },
                },
                {
                  type: 'text',
                  value: '）',
                },
                {
                  type: 'text',
                  value: '，',
                },
                {
                  type: 'text',
                  value: '同比',
                },
                {
                  type: 'text',
                  value: '上月',
                },
                {
                  type: 'text',
                  value: '同期',
                },
                {
                  type: 'entity',
                  value: '23.75万',
                  metadata: {
                    entityType: 'delta_value',
                    assessment: 'positive',
                    origin: 237522,
                  },
                },
                {
                  type: 'text',
                  value: '(',
                },
                {
                  type: 'entity',
                  value: '7.19%',
                  metadata: {
                    entityType: 'ratio_value',
                    assessment: 'positive',
                    origin: 0.07185888524669518,
                  },
                },
                {
                  type: 'text',
                  value: ')',
                },
                {
                  type: 'text',
                  value: '。 ',
                },
              ],
            },
          ],
        },
        {
          type: 'normal',
          phrases: [],
        },
      ],
    },
    {
      paragraphs: [
        {
          type: 'normal',
          phrases: [
            {
              type: 'text',
              value: '本月成本情况如下：',
            },
          ],
        },
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
              type: 'entity',
              value: '7.31亿',
              metadata: {
                entityType: 'metric_value',
                origin: 731344401.59,
              },
            },
            {
              type: 'text',
              value: '，',
            },
            {
              type: 'text',
              value: '同比',
            },
            {
              type: 'text',
              value: '上月',
            },
            {
              type: 'text',
              value: '同期',
            },
            {
              type: 'entity',
              value: '486.65万',
              metadata: {
                entityType: 'delta_value',
                assessment: 'negative',
                origin: -4866493.21,
              },
            },
            {
              type: 'text',
              value: '(',
            },
            {
              type: 'entity',
              value: '0.66%',
              metadata: {
                entityType: 'ratio_value',
                assessment: 'negative',
                origin: -0.006610189069970281,
              },
            },
            {
              type: 'text',
              value: ')',
            },
            {
              type: 'text',
              value: '，',
            },
            {
              type: 'text',
              value: '月同比',
            },
            {
              type: 'text',
              value: '波动的主要原因是：',
            },
          ],
          className: '',
        },
        {
          type: 'bullets',
          isOrder: true,
          bullets: [
            {
              type: 'bullet-item',
              phrases: [
                {
                  type: 'text',
                  value: '商品类别=设备',
                },
                {
                  type: 'entity',
                  value: '656.30万',
                  metadata: {
                    entityType: 'delta_value',
                    assessment: 'negative',
                    origin: -6563003.27,
                  },
                },
                {
                  type: 'text',
                  value: '/',
                },
                {
                  type: 'entity',
                  value: '0.92%',
                  metadata: {
                    entityType: 'ratio_value',
                    assessment: 'negative',
                    origin: -0.009174537571790412,
                  },
                },
                {
                  type: 'text',
                  value: '（贡献度',
                },
                {
                  type: 'entity',
                  value: '134.86%',
                  metadata: {
                    entityType: 'contribute_ratio',
                    origin: 1.3486103826290965,
                  },
                },
                {
                  type: 'text',
                  value: '）',
                },
                {
                  type: 'text',
                  value: '； ',
                },
              ],
            },
            {
              type: 'bullet-item',
              phrases: [
                {
                  type: 'text',
                  value: '商品类别=家具',
                },
                {
                  type: 'entity',
                  value: '169.22万',
                  metadata: {
                    entityType: 'delta_value',
                    assessment: 'positive',
                    origin: 1692209.56,
                  },
                },
                {
                  type: 'text',
                  value: '/',
                },
                {
                  type: 'entity',
                  value: '8.43%',
                  metadata: {
                    entityType: 'ratio_value',
                    assessment: 'positive',
                    origin: 0.08430269929839627,
                  },
                },
                {
                  type: 'text',
                  value: '（贡献度',
                },
                {
                  type: 'entity',
                  value: '-34.77%',
                  metadata: {
                    entityType: 'contribute_ratio',
                    origin: -0.34772668674904,
                  },
                },
                {
                  type: 'text',
                  value: '）',
                },
                {
                  type: 'text',
                  value: '； ',
                },
              ],
            },
            {
              type: 'bullet-item',
              phrases: [
                {
                  type: 'text',
                  value: '商品类别=办公用品',
                },
                {
                  type: 'entity',
                  value: '4,300.50',
                  metadata: {
                    entityType: 'delta_value',
                    assessment: 'positive',
                    origin: 4300.5,
                  },
                },
                {
                  type: 'text',
                  value: '/',
                },
                {
                  type: 'entity',
                  value: '0.55%',
                  metadata: {
                    entityType: 'ratio_value',
                    assessment: 'positive',
                    origin: 0.00545669020354146,
                  },
                },
                {
                  type: 'text',
                  value: '（贡献度',
                },
                {
                  type: 'entity',
                  value: '-0.09%',
                  metadata: {
                    entityType: 'contribute_ratio',
                    origin: -0.0008836958800565141,
                  },
                },
                {
                  type: 'text',
                  value: '）',
                },
                {
                  type: 'text',
                  value: '。 ',
                },
              ],
            },
          ],
        },
        {
          type: 'normal',
          phrases: [
            {
              type: 'entity',
              value: '单位成本',
              metadata: {
                entityType: 'metric_name',
              },
            },
            {
              type: 'entity',
              value: '1.48亿',
              metadata: {
                entityType: 'metric_value',
                origin: 147991422.04,
              },
            },
            {
              type: 'text',
              value: '，',
            },
            {
              type: 'text',
              value: '同比',
            },
            {
              type: 'text',
              value: '上月',
            },
            {
              type: 'text',
              value: '同期',
            },
            {
              type: 'entity',
              value: '3,085.49万',
              metadata: {
                entityType: 'delta_value',
                assessment: 'negative',
                origin: -30854923.78,
              },
            },
            {
              type: 'text',
              value: '(',
            },
            {
              type: 'entity',
              value: '17.25%',
              metadata: {
                entityType: 'ratio_value',
                assessment: 'negative',
                origin: -0.17252196928336438,
              },
            },
            {
              type: 'text',
              value: ')',
            },
            {
              type: 'text',
              value: '，',
            },
            {
              type: 'text',
              value: '月同比',
            },
            {
              type: 'text',
              value: '波动的主要原因是：',
            },
          ],
          className: '',
        },
        {
          type: 'bullets',
          isOrder: true,
          bullets: [
            {
              type: 'bullet-item',
              phrases: [
                {
                  type: 'text',
                  value: '商品类别=设备',
                },
                {
                  type: 'entity',
                  value: '3,165.88万',
                  metadata: {
                    entityType: 'delta_value',
                    assessment: 'negative',
                    origin: -31658785.74,
                  },
                },
                {
                  type: 'text',
                  value: '/',
                },
                {
                  type: 'entity',
                  value: '18.11%',
                  metadata: {
                    entityType: 'ratio_value',
                    assessment: 'negative',
                    origin: -0.18109775473452105,
                  },
                },
                {
                  type: 'text',
                  value: '（贡献度',
                },
                {
                  type: 'entity',
                  value: '102.61%',
                  metadata: {
                    entityType: 'contribute_ratio',
                    origin: 1.0260529556232791,
                  },
                },
                {
                  type: 'text',
                  value: '）',
                },
                {
                  type: 'text',
                  value: '； ',
                },
              ],
            },
            {
              type: 'bullet-item',
              phrases: [
                {
                  type: 'text',
                  value: '商品类别=家具',
                },
                {
                  type: 'entity',
                  value: '79.68万',
                  metadata: {
                    entityType: 'delta_value',
                    assessment: 'positive',
                    origin: 796830.05,
                  },
                },
                {
                  type: 'text',
                  value: '/',
                },
                {
                  type: 'entity',
                  value: '20.61%',
                  metadata: {
                    entityType: 'ratio_value',
                    assessment: 'positive',
                    origin: 0.2060784391702808,
                  },
                },
                {
                  type: 'text',
                  value: '（贡献度',
                },
                {
                  type: 'entity',
                  value: '-2.58%',
                  metadata: {
                    entityType: 'contribute_ratio',
                    origin: -0.025825053261564077,
                  },
                },
                {
                  type: 'text',
                  value: '）',
                },
                {
                  type: 'text',
                  value: '； ',
                },
              ],
            },
            {
              type: 'bullet-item',
              phrases: [
                {
                  type: 'text',
                  value: '商品类别=办公用品',
                },
                {
                  type: 'entity',
                  value: '7,031.91',
                  metadata: {
                    entityType: 'delta_value',
                    assessment: 'positive',
                    origin: 7031.91,
                  },
                },
                {
                  type: 'text',
                  value: '/',
                },
                {
                  type: 'entity',
                  value: '4.30%',
                  metadata: {
                    entityType: 'ratio_value',
                    assessment: 'positive',
                    origin: 0.042954107603249234,
                  },
                },
                {
                  type: 'text',
                  value: '（贡献度',
                },
                {
                  type: 'entity',
                  value: '-0.02%',
                  metadata: {
                    entityType: 'contribute_ratio',
                    origin: -0.0002279023617150546,
                  },
                },
                {
                  type: 'text',
                  value: '）',
                },
                {
                  type: 'text',
                  value: '。 ',
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

ReactDOM.render(<NarrativeTextVis spec={spec} />, document.getElementById('container'));
