import React, { useState } from 'react';

import { Button, Space, Card } from 'antd';
import { Advisor } from '@antv/ava';

// 渲染器已在 App.tsx 中全局绑定，这里直接使用
const advisor = new Advisor({
  llm: {
    appId: '202510APxPmo00551539',
    authorization: 'TBox-c4ae8a71224e42baaafb1c01d15395a7',
  },
});

const MultipleChartsDemo: React.FC = () => {
  const [data] = useState([
    { 商品类别: '家具', 销售渠道: '物美', 单价: 56.71, 折扣: 0.27 },
    { 商品类别: '办公用品', 销售渠道: '其他', 单价: 1.36, 折扣: 0.87 },
    { 商品类别: '办公用品', 销售渠道: '家乐福', 单价: 6.91, 折扣: 0.18 },
    { 商品类别: '家具', 销售渠道: '世纪联华', 单价: 515.3, 折扣: 0.34 },
    { 商品类别: '家具', 销售渠道: '大润发', 单价: 515.3, 折扣: 0.34 },
    { 商品类别: '设备', 销售渠道: '其他', 单价: 1122.48, 折扣: 0.29 },
    { 商品类别: '办公用品', 销售渠道: '沃尔玛', 单价: 3.07, 折扣: 0.41 },
    { 商品类别: '办公用品', 销售渠道: '欧尚', 单价: 2.7, 折扣: 0.82 },
    { 商品类别: '设备', 销售渠道: '家乐福', 单价: 19127.65, 折扣: 0.15 },
    { 商品类别: '家具', 销售渠道: '沃尔玛', 单价: 313.73, 折扣: 0.22 },
    { 商品类别: '设备', 销售渠道: '世纪联华', 单价: 19597.57, 折扣: 0.47 },
    { 商品类别: '办公用品', 销售渠道: '大润发', 单价: 4.85, 折扣: 0.3 },
    { 商品类别: '设备', 销售渠道: '物美', 单价: 19531.88, 折扣: 0.32 },
  ]);

  const advise = async () => {
    const res = await advisor.advise({ data });
    res.forEach((item) => {
      const { adviseCharts } = item;
      advisor.render({
        container: '#charts',
        spec: adviseCharts[0].spec,
      });
    });
  };

  return (
    <div style={{ padding: '20px' }}>
      <Card title="Multiple Charts Demo" style={{ marginBottom: '20px' }}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <h3>数据预览：</h3>
            <pre
              style={{
                background: '#f5f5f5',
                padding: '10px',
                borderRadius: '4px',
                maxHeight: '200px',
                overflow: 'auto',
              }}
            >
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
          <Button type="primary" onClick={advise}>
            生成多个图表建议
          </Button>
          <div>
            <h3>图表展示：</h3>
            <div
              id="charts"
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

export default MultipleChartsDemo;
