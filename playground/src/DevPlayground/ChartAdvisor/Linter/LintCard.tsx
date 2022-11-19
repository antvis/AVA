import React from 'react';

import { List } from 'antd';

import { AdvisorTypes } from '../../../../../packages/ava/lib';

type LintProps = {
  lints: AdvisorTypes.Lint[];
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
      renderItem={(item: AdvisorTypes.Lint, index) => {
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
