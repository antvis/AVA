import React, { useEffect, useState } from 'react';
import { Input, Button, Space, Card, message } from 'antd';
import { AVA, bindRenderer } from '../../../../src';
import { cleanAndFormatJSON, formatJSON } from '../../utils';
import { GPTVis } from '@antv/gpt-vis';
import ReactDOM from 'react-dom/client';

// 自定义 GPTVis Markdown 渲染
const gptVisRenderer = (container: string, spec: any) => {
  const mount = document.querySelector(container) as HTMLElement;
  if (!mount) return;

  mount.innerHTML = '';

  const content = `## GPT-VIS
  Components for GPTs, generative AI, and LLM projects. Not only UI Components.
  \`\`\`vis-chart
  ${JSON.stringify(spec)}
  \`\`\``;
  const root = ReactDOM.createRoot(mount);
  root.render(<GPTVis>{content}</GPTVis>);
};

const ava = new AVA({
  llm: {
    appId: '202511APkFwG00560135',
    authorization: 'TBox-174d46eaa4374e96b3fd99b6fec527d7',
  },
});

const sampleData = {
  type: 'bar',
  data: [
    { category: '2013', value: 59.3 },
    { category: '2014', value: 64.4 },
    { category: '2015', value: 68.9 },
    { category: '2016', value: 74.4 },
    { category: '2017', value: 82.7 },
    { category: '2018', value: 91.9 },
    { category: '2019', value: 99.1 },
    { category: '2020', value: 101.6 },
    { category: '2021', value: 114.4 },
    { category: '2022', value: 121 },
  ],
  axisXTitle: 'year',
  axisYTitle: 'GDP',
};

const RenderGPTVisSSR: React.FC = () => {
  const [data, setData] = useState(JSON.stringify(sampleData, null, 2));

  useEffect(() => {
    bindRenderer(gptVisRenderer as any);
  }, []);

  const render = async () => {
    try {
      const cleaned = cleanAndFormatJSON(data);
      const parsedData = JSON.parse(cleaned);
      ava.render('#chart', parsedData);
    } catch (error) {
      message.error(`请输入有效的 JSON 格式数据: ${error}`);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <Card title="GPT-Vis 图表渲染" style={{ marginBottom: '20px' }}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <h3>输入图表数据：</h3>
            <Input.TextArea
              value={data}
              onChange={(e) => {
                setData(e.target.value);
              }}
              placeholder="请输入图表数据（JSON 格式）"
              rows={10}
              style={{ fontFamily: 'monospace' }}
            />
          </div>
          <Space>
            <Button onClick={() => formatJSON(data, setData)}>格式化 JSON</Button>
            <Button type="primary" onClick={render}>
              生成图表
            </Button>
          </Space>
          <div>
            <h3>图表展示：</h3>
            <div
              id="chart"
              style={{
                border: '1px solid #d9d9d9',
                borderRadius: '4px',
                padding: '20px',
                minHeight: '400px',
              }}
            />
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default RenderGPTVisSSR;
