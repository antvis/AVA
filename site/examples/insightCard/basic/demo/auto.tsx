import React from 'react';

import ReactDOM from 'react-dom';
import { InsightCard } from '@antv/ava-react';

import { timeSeriesData } from './mockData';

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
