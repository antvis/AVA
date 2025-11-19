/* eslint-disable import/no-unresolved */
import React, { useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { Input, Button, Space, Card } from 'antd';
import { JsonView } from 'react-json-view-lite';
import { AVA } from '@antv/ava';

const ava = new AVA({
  llm: {
    appId: '202510APxPmo00551539',
    authorization: 'TBox-c4ae8a71224e42baaafb1c01d15395a7',
  },
});

const CARD_STYLE = {
  width: '100%',
  maxHeight: '500px',
  overflow: 'auto',
};

const INPUT_DATA =
  '一个超市的商品分类及其库存数量，如有三个主分类：食品、饮料和日用品。食品类有 300 件，饮料类有 200 件，日用品类有 500 件。食品类分为新鲜食品 150 件、罐头食品 100 件和零食 50 件；饮料类分为碳酸饮料 100 件和果汁 100 件；日用品类分为清洁用品 300 件和个人护理 200 件';

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
