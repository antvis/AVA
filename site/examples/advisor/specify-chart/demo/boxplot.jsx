import React, { useState, useEffect } from 'react';
import { Input, Button, message, Space } from 'antd';
import ReactDOM from 'react-dom';
import { AVA, bindRenderer } from '@antv/ava';
import { DEFAULT_CHART_COMPONENTS } from '@antv/gpt-vis';

const { createRoot } = ReactDOM;

export const render = (container, spec) => {
  const mount = typeof container === 'string' ? document.querySelector(container) : container;
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

// 创建 ava 实例
const ava = new AVA({
  llm: {
    appId: 'your tbox appId',
    authorization: 'your tbox authorization',
  },
});

const sampleQuery = '用箱线图展示不同交通方式的通勤时长分布：公交样本（分钟）[40, 45, 50, 55, 60, 52]；地铁样本[28, 30, 32, 35, 38, 34]；汽车样本[20, 25, 30, 27, 33, 29]。';

const App = () => {
  const [query, setQuery] = useState(sampleQuery);
  const [isAdvising, setIsAdvising] = useState(false);

  useEffect(() => {
    // 为ava实例绑定渲染器;
    bindRenderer(render);
  }, []);

  const advise = async () => {
    if (isAdvising) return;
    setIsAdvising(true);
    const hide = message.loading('正在生成图表建议...', 0);
    try {
      const advises = await ava.advise(query);
      ava.render('#chart', advises[0].charts[0].spec);
    } finally {
      hide();
      setIsAdvising(false);
    }
  };

  return (
    <div>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Input.TextArea value={query} onChange={(e) => setQuery(e.target.value)} placeholder="请输入图表数据" />
        <Button onClick={advise} disabled={isAdvising} loading={isAdvising}>advise</Button>
        <div id="chart" />
      </Space>
    </div>
  );
};

const mountNode = document.getElementById('container');
if (mountNode) {
  const root = createRoot(mountNode);
  root.render(<App />);
}