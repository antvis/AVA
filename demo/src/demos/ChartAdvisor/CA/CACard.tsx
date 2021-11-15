import React from 'react';
import { List } from 'antd';
import { Lint, Advice } from '@antv/chart-advisor';
import { Chart } from '../Chart';

type Result = Advice & {
  lint: Lint[];
};

type CAProps = {
  results: Result[];
};

export const CACard = ({ results }: CAProps) => {
  return (
    <List
      // for update
      key={`ca-${+new Date()}`}
      itemLayout="vertical"
      pagination={{
        pageSize: 1,
      }}
      split={false}
      dataSource={results}
      renderItem={(item, index) => {
        return (
          <List.Item key={index}>
            <div style={{ display: 'flex' }}>
              <Chart id={`chartadvice-${index}`} spec={item.spec}>
                {' '}
              </Chart>
              <div style={{ alignSelf: 'flex-end', width: 150 }}>
                <div>Type: {item.type}</div>
                <div>Score: {item.score.toFixed(2)}</div>
              </div>
            </div>
            <List
              // for update
              key={`calint-${index}-${+new Date()}`}
              itemLayout="vertical"
              pagination={{ pageSize: 1, size: 'small', simple: true, defaultCurrent: 1 }}
              dataSource={item.lint}
              split={false}
              renderItem={(item: Lint, index) => {
                return (
                  <List.Item key={index} style={{ height: 150, width: '80%', margin: '20 auto' }}>
                    <div>
                      <strong style={{ fontSize: 18 }}>Error ID: {item.id}</strong>
                      <div>Error Type: {item.type}</div>
                      <div>Score: {item.score}</div>
                      <div>docs: {item.docs.lintText}</div>
                    </div>
                  </List.Item>
                );
              }}
            ></List>
          </List.Item>
        );
      }}
    ></List>
  );
};
