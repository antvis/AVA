/* eslint-disable import/no-unresolved */
import React, { useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { Input, Button } from 'antd';
import { AVA } from '@antv/ava';

const advisor = new AVA({
  llm: {
    appId: '202510APxPmo00551539',
    authorization: 'TBox-c4ae8a71224e42baaafb1c01d15395a7',
  },
});

const App = () => {
  const [input, setInput] = useState(
    `
    一个超市的商品分类及其库存数量，如有三个主分类：食品、饮料和日用品。食品类有 300 件，饮料类有 200 件，日用品类有 500 件。食品类分为新鲜食品 150 件、罐头食品 100 件和零食 50 件；饮料类分为碳酸饮料 100 件和果汁 100 件；日用品类分为清洁用品 300 件和个人护理 200 件
  `.trim()
  );
  const [reslut, setResult] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleExtract = useCallback(async () => {
    setLoading(true);
    const result = await advisor.extract(input);
    setResult(result);
    setLoading(false);
  }, [loading]);

  return (
    <div>
      <h3>输入内容：</h3>
      <Input.TextArea style={{ height: '300px' }} value={input} onChange={(e) => setInput(e.target.value)} />
      <Button onClick={handleExtract} loading={loading}>
        提取
      </Button>
      <h3>提取结果：</h3>
      <pre>
        <code lang="json">{JSON.stringify(reslut, null, 2)}</code>
      </pre>
    </div>
  );
};

const mountNode = document.getElementById('container');
if (mountNode) {
  const root = ReactDOM.createRoot(mountNode);
  root.render(<App />);
}
