/* eslint-disable import/no-unresolved */
import React, { useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { Input, Button, Space, Card } from 'antd';
import { JsonView } from 'react-json-view-lite';
import { AVA } from '@antv/ava';

const ava = new AVA({
  llm: {
    appId: 'your tbox appId',
    authorization: 'your tbox authorization',
  },
});

const CARD_STYLE = {
  width: '100%',
  maxHeight: '500px',
  overflow: 'auto',
};

const INPUT_DATA = `
[
  {
    "name": "电子产品",
    "value": 1000,
    "children": [
      {
        "name": "手机",
        "value": 400,
        "children": [
          {
            "name": "品牌X",
            "value": 200
          },
          {
            "name": "品牌Z",
            "value": 100
          }
        ]
      },
      {
        "name": "电脑",
        "value": 300,
        "children": [
          {
            "name": "笔记本",
            "value": 150
          },
          {
            "name": "台式机",
            "value": 150
          }
        ]
      },
      {
        "name": "平板",
        "value": 300
      }
    ]
  },
  {
    "name": "家电",
    "value": 800,
    "children": [
      {
        "name": "冰箱",
        "value": 200
      },
      {
        "name": "洗衣机",
        "value": 200
      }
    ]
  },
  {
    "name": "服装",
    "value": 600,
    "children": [
      {
        "name": "男装",
        "value": 200
      },
      {
        "name": "女装",
        "value": 200
      },
      {
        "name": "童装",
        "value": 200
      }
    ]
  },
  {
    "name": "食品",
    "value": 400,
    "children": [
      {
        "name": "饮料",
        "value": 100
      },
      {
        "name": "零食",
        "value": 100
      },
    ]
  }
]
`.trim();

const App = () => {
  const [input, setInput] = useState(INPUT_DATA);
  const [reslut, setResult] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleExtract = useCallback(async () => {
    setLoading(true);
    const result = await ava.extract(input);
    setResult(result);
    setLoading(false);
  }, [loading]);

  return (
    <Space style={{ width: '100%' }} direction="vertical" size="middle">
      <Card
        style={CARD_STYLE}
        title="输入内容："
        actions={[
          <Button key="run" type="primary" onClick={handleExtract} loading={loading}>
            提取
          </Button>,
        ]}
      >
        <Input.TextArea readOnly style={{ height: '300px' }} value={input} onChange={(e) => setInput(e.target.value)} />
      </Card>
      <Card style={CARD_STYLE} title="提取结果：">
        <JsonView data={reslut} />
      </Card>
    </Space>
  );
};

const mountNode = document.getElementById('container');
if (mountNode) {
  const root = ReactDOM.createRoot(mountNode);
  root.render(<App />);
}
