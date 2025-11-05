import React, { useEffect, useState } from 'react';

import ReactDOM from 'react-dom/client';
import { Input, Button, Space, Card, message } from 'antd';
import { Advisor, bindRenderer } from '../../../../src';
import { cleanAndFormatJSON, formatJSON } from '../../utils';

// 自定义图片渲染器
const customImageRenderer = (params: any) => {
  const { container, spec } = params || {};
  const { url } = spec;
  const mount =
    typeof container === 'string' ? (document.querySelector(container) as HTMLElement) : (container as HTMLElement);
  if (!mount) return;

  // 清空之前的内容
  mount.innerHTML = '';

  const chartElement = React.createElement('img', { src: url, style: { maxWidth: '100%', height: '400px' } });
  const root = ReactDOM.createRoot(mount);
  root.render(chartElement);
};

// 创建 advisor 实例并为该实例绑定自定义渲染器
const advisor = new Advisor({
  llm: {
    appId: '202511APkFwG00560135',
    authorization: 'TBox-174d46eaa4374e96b3fd99b6fec527d7',
  },
});

// 为当前实例绑定自定义渲染器

const sampleData = {
  type: 'image',
  url: 'https://mdn.alipayobjects.com/one_clip/afts/img/e1W0SZar5zYAAAAARJAAAAgAoEACAQFr/original',
};

const RenderCustom: React.FC = () => {
  const [data, setData] = useState(JSON.stringify(sampleData, null, 2));

  useEffect(() => {
    bindRenderer(customImageRenderer as any);
  }, []);

  const render = async () => {
    try {
      // 清理可能存在的外层引号
      const cleaned = cleanAndFormatJSON(data);
      // 将 JSON 字符串解析为对象
      const parsedData = JSON.parse(cleaned);
      advisor.render('#img-chart', parsedData);
    } catch (error) {
      message.error(`请输入有效的 JSON 格式数据: ${error}`);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <Card title="自定义图表渲染" style={{ marginBottom: '20px' }}>
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
              id="img-chart"
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

export default RenderCustom;
