import React, { useRef } from 'react';
import ReactDOM from 'react-dom';
import { ChartView, LintCard } from 'antv-site-demo-rc';

// import
import { Linter } from '@antv/chart-advisor';

// contants

const errorSpec = {
  basis: {
    type: 'chart',
  },
  data: {
    type: 'json-array',
    values: [
      { category: 'A', value: 4 },
      { category: 'B', value: 6 },
      { category: 'C', value: 10 },
      { category: 'D', value: 3 },
      { category: 'E', value: 7 },
      { category: 'F', value: 8 },
    ],
  },
  layer: [
    {
      mark: 'arc',
      encoding: {
        theta: { field: 'value', type: 'quantitative' },
        color: {
          field: 'category',
          type: 'nominal',
          scale: { range: ['#5b8ff9', '#753d91', '#b03c63', '#d5b471', '#4fb01f', '#608b7d'] },
        },
      },
    },
  ],
};

// usage
const myLinter = new Linter();
const problems = myLinter.lint({ spec: errorSpec });

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
