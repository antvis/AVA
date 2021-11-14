import React, { useRef } from 'react';
import ReactDOM from 'react-dom';
import { ChartView, LintCard } from 'antv-site-demo-rc';

// import
import { Linter } from '@antv/chart-advisor';

// contants

const iDontLikeSpec = {
  basis: {
    type: 'chart',
  },
  data: {
    type: 'json-array',
    values: [
      { price: 520, year: 2005 },
      { price: 600, year: 2006 },
      { price: 1500, year: 2007 },
    ],
  },
  layer: [
    {
      mark: {
        type: 'line',
      },
      encoding: {
        x: {
          field: 'year',
          type: 'temporal',
        },
        y: {
          field: 'price',
          type: 'quantitative',
        },
      },
    },
  ],
};

// custom rule
const myRule = {
  id: 'no-line-chart-with-year',
  type: 'HARD',
  docs: {
    lintText: "We do not use line chart if there is any field named 'year'",
  },
  trigger: (args) => {
    const { chartType } = args;
    return chartType === 'line_chart';
  },
  validator: (args) => {
    let result = 1;
    const { dataProps } = args;
    const fieldNames = dataProps.map((prop) => prop.name);
    if (fieldNames.includes('year')) {
      result = 0;
    }
    return result;
  },
};

// custom rule Config
const myRuleCfg = {
  custom: {
    'no-line-chart-with-year': myRule,
  },
};

// usage
const myLinter = new Linter(myRuleCfg);

const problems = myLinter.lint({ spec: iDontLikeSpec });

const App = () => {
  const myRef = useRef();
  return (
    <>
      <LintCard lintProblems={problems} />
      <ChartView chartRef={myRef} spec={iDontLikeSpec} />
    </>
  );
};

ReactDOM.render(<App />, document.getElementById('container'));
