import React from 'react';
import { AutoChart } from '../../../../packages/auto-chart/src';
import testData from './data.json';

const autoChartExp =  (
  <AutoChart
    title="hello world"
    description="ceshi test"
    data={testData}
    fields={['f1', 'f2']}
  />
);

export default autoChartExp;
