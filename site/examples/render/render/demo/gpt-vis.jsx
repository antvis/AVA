import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { GPTVis, DEFAULT_CHART_COMPONENTS } from '@antv/gpt-vis';
import { Advisor, bindRenderer } from '@antv/ava';

const { createRoot } = ReactDOM;


console.log('[common.jsx] Module level - DEFAULT_CHART_COMPONENTS:', DEFAULT_CHART_COMPONENTS, GPTVis );

const renderGPTVis = (container, spec) => {
  const mount = document.querySelector(container);
  if (!mount) return;

  const content = `####  使用 GPT-VIS 协议渲染
  Components for GPTs, generative AI, and LLM projects. Not only UI Components.
  \`\`\`vis-chart
  ${JSON.stringify(spec)}
  \`\`\``;
  const chartElement = React.createElement(GPTVis, null, content);
  const root = createRoot(mount);
  root.render(chartElement);
};

const advisor = new Advisor({
  llm: {
    appId: '202511APkFwG00560135',
    authorization: 'TBox-174d46eaa4374e96b3fd99b6fec527d7',
  },
});

const GPTVisAPP = () => {

  useEffect(() => {

    bindRenderer(renderGPTVis);
    advisor.render('#charts', {
      'type': 'funnel',
      'data': [
        { 'category': '浏览网站', 'value': 50000 },
        { 'category': '放入购物车', 'value': 35000 },
        { 'category': '生成订单', 'value': 25000 },
        { 'category': '支付订单', 'value': 15000 },
        { 'category': '完成交易', 'value': 8000 }
      ]
    });

    return () => {
      advisor.destroy();
    };
  }, []);

  return (
    <div id="charts" />
  );
};

const root = createRoot(document.getElementById('container'));
root.render(<GPTVisAPP />);
