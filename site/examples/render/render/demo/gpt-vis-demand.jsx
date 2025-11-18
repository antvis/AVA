import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { GPTVisLite, withChartCode, Pie, ChartType } from '@antv/gpt-vis';
import { Advisor, bindRenderer } from '@antv/ava';

const { createRoot } = ReactDOM;

const components = {
  code: withChartCode({
    components: { [ChartType.Pie]: Pie }, // register a pie chart
  }),
};

const renderPie = (container, spec) => {
  const mount = document.querySelector(container);
  if (!mount) return;

  mount.innerHTML = '';

  const content = `## GPT-VIS
  Components for GPTs, generative AI, and LLM projects. Not only UI Components.
  \`\`\`vis-chart
  ${JSON.stringify(spec)}
  \`\`\``;
  const chartElement = React.createElement(GPTVisLite, { components }, content);
  const root = ReactDOM.createRoot(mount);
  root.render(chartElement);
};

const advisor = new Advisor();

const App = () => {
  useEffect(() => {
    bindRenderer(renderPie);
    advisor.render('#chart', {
      'type': 'pie',
      'data': [
        { 'category': '分类一', 'value': 27 },
        { 'category': '分类二', 'value': 25 },
        { 'category': '分类三', 'value': 18 },
        { 'category': '分类四', 'value': 15 },
        { 'category': '分类五', 'value': 10 },
        { 'category': '其他', 'value': 5 }
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
