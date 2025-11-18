import React, { useEffect } from 'react';
import { Area } from '@antv/gpt-vis';
import ReactDOM from 'react-dom';
import { Advisor, bindRenderer } from '@antv/ava';

const { createRoot } = ReactDOM;

const renderArea = (container, spec) => {
  const mount = document.querySelector(container);
  if (!mount) return;

  const { type, ...chartProps } = spec;
  const VISComps = { area: Area };
  const Comp = VISComps[type];

  if (!Comp) {
    throw new Error(`Unknown chart type: ${type}`);
  }
  const chartElement = React.createElement(Comp, chartProps);
  const root = createRoot(mount);
  root.render(chartElement);
};

const advisor = new Advisor();

const App = () => {
  useEffect(() => {
    bindRenderer(renderArea);
    advisor.render('#chart', {
      'type': 'area',
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
