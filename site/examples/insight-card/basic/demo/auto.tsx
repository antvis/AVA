import React from 'react';

import ReactDOM from 'react-dom';
import { InsightCard } from '@antv/ava-react';

const timeSeriesData = [
  {
    year: '1955',
    pop: 2182678196,
  },
  {
    year: '1960',
    pop: 2394564086,
  },
  {
    year: '1965',
    pop: 2618176519,
  },
  {
    year: '1970',
    pop: 2906025531,
  },
  {
    year: '1975',
    pop: 3211425244,
  },
  {
    year: '1980',
    pop: 3500588903,
  },
  {
    year: '1985',
    pop: 3804113397,
  },
  {
    year: '1990',
    pop: 4133335721,
  },
  {
    year: '1995',
    pop: 4455059580,
  },
  {
    year: '2000',
    pop: 4749735887,
  },
  {
    year: '2005',
    pop: 5014673090,
  },
];

// 由于自动洞察目前内置的显著性打分效果不是很好，导致选择第一个洞察展示经常不能达到最优效果，待这个问题优化后再透出 demo
ReactDOM.render(
  <InsightCard
    // 自动洞察配置，传入全部数据以及指定的维度和指标字段，组件内会自动进行洞察计算，并选择显著性最大的结果进行展示
    // Configuration for automatic insight, which takes in all data along with specified dimension and measure fields
    autoInsightOptions={{
      allData: timeSeriesData,
      dimensions: [{ fieldName: 'year' }],
      measures: [
        {
          fieldName: 'pop',
          method: 'SUM',
        },
      ],
    }}
    // 语言配置，默认为 'en-US' ; language config, 'en-US' by default
    visualizationOptions={{ lang: 'zh-CN' }}
  />,
  document.getElementById('container')
);
