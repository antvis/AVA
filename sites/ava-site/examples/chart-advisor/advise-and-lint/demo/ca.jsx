import React from 'react';
import ReactDOM from 'react-dom';
import { PagList, JSONView } from 'antv-site-demo-rc';

// import
import { ChartAdvisor } from '@antv/chart-advisor';

// contants

const defaultData = [
  { price: 100, type: 'A' },
  { price: 120, type: 'B' },
  { price: 150, type: 'C' },
];

// usage
const myChartAdvisor = new ChartAdvisor();
const results = myChartAdvisor.advise({ data: defaultData });

const App = () => (
  <PagList
    data={results}
    renderItem={(item) => <JSONView json={item} style={{ height: '100%' }} rjvConfigs={{ collapsed: 1 }} />}
  />
);

ReactDOM.render(<App />, document.getElementById('container'));
