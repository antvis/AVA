import React from 'react';
import { AutoChart } from '../../../../packages/auto-chart/src';
import testData from './data.json';

const autoChartExp =  (
  <AutoChart
    title="hello world"
    description="ceshi test"
<<<<<<< HEAD
    data={[]}
    language={'zh-CN'}
=======
    data={testData}
    language={'en-US'}
>>>>>>> 9b9f66b89955bfcfc56b09b5bc401ee5bc03faf9
    fields={['f1', 'f2']}
  />
);

export default autoChartExp;
