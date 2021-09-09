import React from 'react';
import { AutoChart } from '../../../../packages/auto-chart/src';
import testData from './data.json';

const autoChartExp =  (
  <AutoChart
    id="autochartTest"
    title="hello world"
    description="ceshi test"
    data={testData}
    fields={['price', 'type']}
  />
);

export default autoChartExp;
