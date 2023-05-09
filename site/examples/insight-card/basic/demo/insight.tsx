import React from 'react';

import ReactDOM from 'react-dom';
import { InsightCard } from '@antv/ava-react';
import { getInsights } from '@antv/ava';

const data = [
  { year: '2000', value: 1 },
  { year: '2001', value: -1 },
  { year: '2002', value: 2 },
  { year: '2003', value: -2 },
  { year: '2004', value: 7 },
  { year: '2005', value: 3 },
  { year: '2006', value: -3 },
  { year: '2007', value: 0 },
  { year: '2008', value: 0 },
  { year: '2009', value: 1 },
];

const firstInsight = getInsights(data).insights[0];

// 如果需要修改语言配置，使用 visualizationOptions={{ lang: 'zh-CN' }} 默认为 'en-US'
// If language config needed, use visualizationOptions={{ lang: 'zh-CN' }}, 'en-US' by default
ReactDOM.render(<InsightCard insightInfo={firstInsight} />, document.getElementById('container'));
