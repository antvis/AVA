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
    appId: '202511APkFwG00560135',
    authorization: 'TBox-174d46eaa4374e96b3fd99b6fec527d7',
  },
});

const sampleQuery =
  '用图表展示一个软件开发公司的项目情况及其投入的开发人员数量，如公司有三个主要项目：移动应用开发、Web 开发和嵌入式系统开发。移动应用开发有 150 人，Web 开发有 100 人，嵌入式系统开发有 200 人。移动应用开发分为 Android 开发 80 人和 iOS 开发 70 人；Web 开发分为前端开发 60 人和后端开发 40 人；嵌入式系统开发分为驱动开发 120 人和应用开发 80 人。';

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
        <Button onClick={advise} disabled={isAdvising} loading={isAdvising}>
          advise
        </Button>
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
