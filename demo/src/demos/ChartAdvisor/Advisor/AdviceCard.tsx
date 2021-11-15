import React from 'react';
import { List } from 'antd';
import { Advice } from '@antv/chart-advisor';
import { Chart } from '../Chart';

type AdviceProps = {
  advices: Advice[];
};

export const AdviceCard = ({ advices }: AdviceProps) => {
  return (
    <List
      // for update
      key={`advice-${+new Date()}`}
      itemLayout="vertical"
      pagination={{
        pageSize: 1,
      }}
      split={false}
      dataSource={advices}
      renderItem={(item: Advice, index) => {
        return (
          <List.Item key={index}>
            <div style={{ display: 'flex' }}>
              <Chart id={`advice-${index}`} spec={item.spec}>
                {' '}
              </Chart>
              <div style={{ alignSelf: 'flex-end', width: 150 }}>
                <div>Type: {item.type}</div>
                <div>Score: {item.score.toFixed(2)}</div>
              </div>
            </div>
          </List.Item>
        );
      }}
    ></List>
  );
};
