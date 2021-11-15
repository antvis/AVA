import React from 'react';
import { List } from 'antd';
import { Lint } from '@antv/chart-advisor';

type LintProps = {
  lints: Lint[];
};

export const LintCard = ({ lints }: LintProps) => {
  return (
    <List
      // for update
      key={`lint-${+new Date()}`}
      itemLayout="vertical"
      pagination={{ pageSize: 1 }}
      dataSource={lints}
      split={false}
      renderItem={(item: Lint, index) => {
        return (
          <List.Item key={index}>
            <strong style={{ fontSize: 18 }}>Error ID: {item.id}</strong>
            <div>Error Type: {item.type}</div>
            <div>Score: {item.score}</div>
            <div>docs: {item.docs.lintText}</div>
          </List.Item>
        );
      }}
    ></List>
  );
};
