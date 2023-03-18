import React, { useRef } from 'react';

import ReactDOM from 'react-dom';
import { ChartView, LintCard } from 'antv-site-demo-rc';
// import
import { Advisor } from '@antv/ava';

// contants

const errorSpec = {
  type: 'interval',
  data: [
    { category: 'A', value: 4 },
    { category: 'B', value: 6 },
    { category: 'C', value: 10 },
    { category: 'D', value: 3 },
    { category: 'E', value: 7 },
    { category: 'F', value: 8 },
  ],
  encode: {
    color: 'category',
    y: 'value',
  },
  scale: {
    color: { range: ['#5b8ff9', '#753d91', '#b03c63', '#d5b471', '#4fb01f', '#608b7d'] },
  },
  transform: [{ type: 'stackY' }],
  coordinate: { type: 'theta' },
};

// usage
const myAdvisor = new Advisor();
const problems = myAdvisor.lint({ spec: errorSpec });

const App = () => {
  const myRef = useRef();
  return (
    <>
      <LintCard lintProblems={problems} />
      <ChartView chartRef={myRef} spec={errorSpec} />
    </>
  );
};

ReactDOM.render(<App />, document.getElementById('container'));
