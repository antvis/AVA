import React from 'react';

import ReactDOM from 'react-dom';
import { InsightCard } from '@antv/ava-react';

import { trendInsightData } from './patterns';

ReactDOM.render(
  <InsightCard
    // insight data 数据洞察信息
    insightInfo={trendInsightData}
    // 语言配置，默认为 'en-US' ; language config, 'en-US' by default
    visualizationOptions={{ lang: 'zh-CN' }}
  />,
  document.getElementById('container')
);
