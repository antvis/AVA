import React, { useEffect } from 'react';
import { DEFAULT_CHART_COMPONENTS } from '@antv/gpt-vis';
import * as GPTVis from '@antv/gpt-vis';
import ReactDOM from 'react-dom';
import { Advisor, bindRenderer } from '@antv/ava';

const { createRoot } = ReactDOM;

const render = (container, spec) => {
  const mount = document.querySelector(container);
  if (!mount) return;

  const { type, ...chartProps } = spec;
  const VISComps = DEFAULT_CHART_COMPONENTS;
  const Comp = VISComps[type];

  if (!Comp) {
    throw new Error(`Unknown chart type: ${type}`);
  }
  const chartElement = React.createElement(Comp, chartProps);
  const root = createRoot(mount);
  root.render(chartElement);
};

const advisor = new Advisor({
  llm: {
    appId: '202511APkFwG00560135',
    authorization: 'TBox-174d46eaa4374e96b3fd99b6fec527d7',
  },
});

const App = () => {
  useEffect(() => {

    bindRenderer(render);
    advisor.render('#chart', {
      'type': 'line',
      'data': [
        { 'time': '2018', 'value': 91.9 },
        { 'time': '2019', 'value': 99.1 },
        { 'time': '2020', 'value': 101.6 },
        { 'time': '2021', 'value': 114.4 },
        { 'time': '2022', 'value': 121 }
      ]
    });

    return () => {
      advisor.destroy();
    };
  }, []);

  return (
    <div id="chart" />
  );
};

const root = createRoot(document.getElementById('container'));
root.render(<App />);
