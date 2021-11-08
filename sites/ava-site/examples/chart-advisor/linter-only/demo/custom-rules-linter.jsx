import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { List } from 'antd';
import { specToG2Plot } from '@antv/antv-spec';

// import
import { Linter } from '@antv/chart-advisor';

const Chart = ({ id, spec }) => {
  useEffect(() => {
    specToG2Plot(spec, document.getElementById(id));
  });

  return <div id={id} style={{ width: '100%', height: 200, margin: 'auto' }}></div>;
};

const LintCard = ({ lints }) => {
  return (
    <List
      key={`lint-${+new Date()}`}
      itemLayout="vertical"
      pagination={{ pageSize: 1 }}
      dataSource={lints}
      split={false}
      renderItem={(item, index) => {
        return (
          <List.Item key={index}>
            <strong style={{ fontSize: 18 }}>Error ID: {item.id}</strong>
            <div>Error Type: {item.type}</div>
            <div>Score: {item.score}</div>
            <div>docs: {item.docs.lintText}</div>
          </List.Item>
        );
      }}
    ></List>
  );
};

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
  return (
    <>
      <LintCard lints={problems} />
      <Chart id={'linter-demo'} spec={iDontLikeSpec} />
    </>
  );
};

ReactDOM.render(<App />, document.getElementById('container'));
