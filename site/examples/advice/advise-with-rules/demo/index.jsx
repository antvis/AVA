import React, { useState } from 'react';

// import
import { Advisor } from '@ava';
import ReactDOM from 'react-dom';
import { Button } from 'antd';

export const PALETTE_1 = ['#8459fc', '#ff89bd', '#1677ff', '#00c2ff', '#ff9a00'];
export const PALETTE_2 = ['#1B9E77', '#D95F02', '#7570B3', '#E7298A', '#66A61E'];
export const PALETTE_3 = ['#7593ed', '#95e3b0', '#6c7893', '#e7c450', '#7460eb'];

const _line = {
  data: [
    {
      month: 'Jan',
      city: 'Tokyo',
      temperature: 7,
    },
    {
      month: 'Jan',
      city: 'London',
      temperature: 3.9,
    },
    {
      month: 'Feb',
      city: 'Tokyo',
      temperature: 6.9,
    },
    {
      month: 'Feb',
      city: 'London',
      temperature: 4.2,
    },
    {
      month: 'Mar',
      city: 'Tokyo',
      temperature: 9.5,
    },
    {
      month: 'Mar',
      city: 'London',
      temperature: 5.7,
    },
    {
      month: 'Apr',
      city: 'Tokyo',
      temperature: 14.5,
    },
    {
      month: 'Apr',
      city: 'London',
      temperature: 8.5,
    },
    {
      month: 'May',
      city: 'Tokyo',
      temperature: 18.4,
    },
    {
      month: 'May',
      city: 'London',
      temperature: 11.9,
    },
    {
      month: 'Jun',
      city: 'Tokyo',
      temperature: 21.5,
    },
    {
      month: 'Jun',
      city: 'London',
      temperature: 15.2,
    },
    {
      month: 'Jul',
      city: 'Tokyo',
      temperature: 25.2,
    },
    {
      month: 'Jul',
      city: 'London',
      temperature: 17,
    },
    {
      month: 'Aug',
      city: 'Tokyo',
      temperature: 26.5,
    },
    {
      month: 'Aug',
      city: 'London',
      temperature: 16.6,
    },
    {
      month: 'Sep',
      city: 'Tokyo',
      temperature: 23.3,
    },
    {
      month: 'Sep',
      city: 'London',
      temperature: 14.2,
    },
    {
      month: 'Oct',
      city: 'Tokyo',
      temperature: 18.3,
    },
    {
      month: 'Oct',
      city: 'London',
      temperature: 10.3,
    },
    {
      month: 'Nov',
      city: 'Tokyo',
      temperature: 13.9,
    },
    {
      month: 'Nov',
      city: 'London',
      temperature: 6.6,
    },
    {
      month: 'Dec',
      city: 'Tokyo',
      temperature: 9.6,
    },
    {
      month: 'Dec',
      city: 'London',
      temperature: 4.8,
    },
  ],
  metas: [
    {
      id: 'month',
      dataType: 'string',
      name: '月份',
    },
    {
      id: 'temperature',
      dataType: 'number',
      name: '温度',
    },
    {
      id: 'city',
      dataType: 'string',
      name: '城市',
    },
  ],
};

const pie = {
  data: [
    {
      type: '男',
      value: 10,
    },
    {
      type: '女',
      value: 90,
    },
  ],
  metas: [
    {
      id: 'type',
      dataType: 'string',
      name: '性别',
    },
    {
      id: 'value',
      dataType: 'number',
      name: '人数',
    },
  ],
};

const _dualAxis = {
  metas: [
    {
      id: 'category',
      name: '季度',
      dataType: 'date',
    },
    {
      id: 'value1',
      name: '销售额(亿元)',
      dataType: 'number',
    },
    {
      id: 'value2',
      name: '利润率',
      dataType: 'number',
    },
  ],
  data: [
    {
      category: '2023-Q1',
      value1: 120,
      value2: 0.15,
    },
    {
      category: '2023-Q2',
      value1: 150,
      value2: 0.18,
    },
    {
      category: '2023-Q3',
      value1: 180,
      value2: 0.2,
    },
    {
      category: '2023-Q4',
      value1: 210,
      value2: 0.22,
    },
  ],
};

const _radar = {
  data: [
    {
      name: '拍照',
      value: 95,
      group: '华为Mate60 Pro',
    },
    {
      name: '续航',
      value: 90,
      group: '华为Mate60 Pro',
    },
    {
      name: '游戏',
      value: 85,
      group: '华为Mate60 Pro',
    },
    {
      name: '屏幕',
      value: 88,
      group: '华为Mate60 Pro',
    },
    {
      name: '系统',
      value: 92,
      group: '华为Mate60 Pro',
    },
    {
      name: '拍照',
      value: 92,
      group: 'iPhone15 Pro',
    },
    {
      name: '续航',
      value: 85,
      group: 'iPhone15 Pro',
    },
    {
      name: '游戏',
      value: 90,
      group: 'iPhone15 Pro',
    },
    {
      name: '屏幕',
      value: 95,
      group: 'iPhone15 Pro',
    },
    {
      name: '系统',
      value: 96,
      group: 'iPhone15 Pro',
    },
    {
      name: '拍照',
      value: 96,
      group: '小米14 Ultra',
    },
    {
      name: '续航',
      value: 88,
      group: '小米14 Ultra',
    },
    {
      name: '游戏',
      value: 92,
      group: '小米14 Ultra',
    },
    {
      name: '屏幕',
      value: 90,
      group: '小米14 Ultra',
    },
    {
      name: '系统',
      value: 85,
      group: '小米14 Ultra',
    },
  ],
  metas: [
    {
      id: 'name',
      name: '性能参数',
      dataType: 'string',
    },
    {
      id: 'value',
      name: '得分',
      dataType: 'number',
    },
    {
      id: 'group',
      name: '机型',
      dataType: 'string',
    },
  ],
};

const App = () => {
  const [chart, setChart] = useState(null);
  // TODO: 后续改成调用faas服务，避免暴露apikey
  const advisor = new Advisor({
    llm: {
      appId: '202511APkFwG00560135',
      authorization: 'TBox-174d46eaa4374e96b3fd99b6fec527d7',
    },
  });

  const adviseChart = async () => {
    const res = await advisor.advise({
      data: pie.data,
      metas: pie.metas,
      // purpose: '雷达图展示',
    });
    const newChart = advisor.render({
      chartConfig: res.adviseCharts[0],
      data: res.data,
      metas: res.metas,
      uiConfig: {
        theme: 'academy',
        backgroundColor: '#eee',
        lineWidth: 5,
        palette: PALETTE_1,
      },
    });
    setChart(newChart);
  };

  return (
    <div>
      <Button onClick={adviseChart}>图表推荐</Button>
      <div>{chart}</div>
    </div>
  );
};

// eslint-disable-next-line react/no-deprecated
ReactDOM.render(<App />, document.getElementById('container'));
