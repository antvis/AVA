import React, { useEffect } from 'react';

import { Alert } from 'antd';

import { ChartAdvisor } from '../../../../../packages/chart-advisor';

const myCA = new ChartAdvisor();

const data = [
  { category: '2008', value: 4 },
  { category: '2009', value: 6 },
  { category: '2010', value: 10 },
  { category: '2011', value: 3 },
  { category: '2012', value: 7 },
];

export const LogTest: React.FC = () => {
  useEffect(() => {
    const results = myCA.adviseWithLog({ data });
    // eslint-disable-next-line no-console
    console.log(results);
  });
  return (
    <>
      <Alert message="Open Console to check test results..." type="warning" />
    </>
  );
};
