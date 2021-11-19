import React from 'react';
import { AutoChart } from '@antv/auto-chart';
import ContentPage from '../../ContentPage';
import testData from './data.json';

const autoChartExp = (
  <div>
    <h1>case 1</h1>
    <AutoChart title="CASE 1" description="auto chart analysis" data={testData} language={'zh-CN'} />
    <h1>case 2</h1>
    <AutoChart title="CASE 2" description="no data can mock chart" language={'zh-CN'} />
  </div>
);

export default <ContentPage>{autoChartExp}</ContentPage>;
