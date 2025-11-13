import React, { useEffect } from 'react';
import { Area } from '@antv/gpt-vis';
import ReactDOM from 'react-dom';
import { Advisor, bindRenderer } from '@antv/ava';

const { createRoot } = ReactDOM;

// 创建一个全局的 root 映射，避免重复创建
const rootMap = new Map();

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

  // 重用或创建新的 root
  let root = rootMap.get(container);
  if (!root) {
    root = createRoot(mount);
    rootMap.set(container, root);
  }

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

    // cleanup 时不需要 unbindRenderer，因为下一个组件会重新绑定
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
