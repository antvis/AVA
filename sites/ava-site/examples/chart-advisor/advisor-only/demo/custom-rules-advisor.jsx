import React from 'react';
import ReactDOM from 'react-dom';
import { PagList, JSONView } from 'antv-site-demo-rc';

// import
import { Advisor } from '@antv/chart-advisor';

// contants

const trickyData = [
  { price: 520, year: 2005 },
  { price: 600, year: 2006 },
  { price: 1500, year: 2007 },
];

// The data above should has a line chart as an advice.
// But, assume we don't like any line chart with a 'year' field:

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
const myAdvisor = new Advisor({ ruleCfg: myRuleCfg });

const advices = myAdvisor.advise({ data: trickyData });

const App = () => (
  <PagList
    data={advices}
    renderItem={(item) => <JSONView json={item} style={{ height: '100%' }} rjvConfigs={{ collapsed: 1 }} />}
  />
);

ReactDOM.render(<App />, document.getElementById('container'));
