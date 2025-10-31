import React, { useState } from 'react';

import ReactDOM from 'react-dom';
import { Advisor } from '@antv/ava';
import { Button } from 'antd';
import { renderChart } from '@antv/ava-renderer';

Advisor.bindRenderer(renderChart);
const advisor = new Advisor({
  llm: {
    appId: '202510APxPmo00551539',
    authorization: 'TBox-c4ae8a71224e42baaafb1c01d15395a7',
  },
});

const App = () => {
  const [chart, setChart] = useState<React.ReactElement>(null);
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
    const charts = res.map((item) => {
      const { adviseCharts, metas, data } = item;
      return advisor.render({
        chartConfig: adviseCharts[0],
        data,
        metas,
        uiConfig: {
          theme: 'academy',
          backgroundColor: '#eee',
          lineWidth: 5,
        },
      });
    });

    const chartsDom = (
      <div>
        {charts.map((chart, index) => (
          <div key={index}>{chart}</div>
        ))}
      </div>
    );

    setChart(chartsDom);
  };

  return (
    <div>
      <Button onClick={advise}>advise</Button>
      <div>{chart}</div>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('container'));
