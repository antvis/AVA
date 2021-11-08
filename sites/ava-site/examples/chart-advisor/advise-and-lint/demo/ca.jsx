import React from 'react';
import ReactDOM from 'react-dom';
import { List } from 'antd';
import ReactJson from 'react-json-view';

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
  <List
    itemLayout="vertical"
    pagination={{ pageSize: 1, position: 'top' }}
    dataSource={results}
    split={false}
    renderItem={(item, index) => {
      return (
        <List.Item key={index}>
          <ReactJson
            src={item}
            iconStyle
            name={false}
            displayObjectSize={false}
            displayDataTypes={false}
            collapsed={1}
          />
        </List.Item>
      );
    }}
  />
);

ReactDOM.render(<App />, document.getElementById('container'));
