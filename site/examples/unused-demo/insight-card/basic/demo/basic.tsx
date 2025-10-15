import React from 'react';

import ReactDOM from 'react-dom';
import { InsightCard, InsightCardProps } from '@antv/ava-react';

const timeSeriesData = [
  { year: '1991', value: 0.3 },
  { year: '1992', value: -0.5 },
  { year: '1993', value: 0.05 },
  { year: '1994', value: -0.2 },
  { year: '1995', value: 0.4 },
  { year: '1996', value: 6 },
  { year: '1997', value: 3 },
  { year: '1998', value: 9 },
  { year: '1999', value: 5 },
];

const patterns: InsightCardProps['insightInfo']['patterns'] = [
  {
    type: 'change_point',
    dimension: 'year',
    measure: 'value',
    significance: 0.8966687862422308,
    index: 5,
    x: '1996',
    y: 6,
  },
  {
    type: 'change_point',
    dimension: 'year',
    measure: 'value',
    significance: 0.6966687862422308,
    index: 7,
    x: '1998',
    y: 9,
  },
];

const trendInsightInfo: InsightCardProps['insightInfo'] = {
  subspace: [],
  dimensions: [{ fieldName: 'year' }],
  measures: [
    {
      fieldName: 'value',
      method: 'SUM',
    },
  ],
  data: timeSeriesData,
  patterns,
};

ReactDOM.render(
  <InsightCard
    // insight data 数据洞察信息
    insightInfo={trendInsightInfo}
    // 语言配置，默认为 'en-US' ; language config, 'en-US' by default
    visualizationOptions={{ lang: 'zh-CN' }}
  />,
  document.getElementById('container')
);
