import React, { useState } from 'react';

import { Button, Divider, Row, Col } from 'antd';

import { Advisor, AdvisorTypes } from '../../../../../packages/ava/lib';
import { Chart } from '../Chart';

import { LintCard } from './LintCard';

const errorSpec = {
  type: 'interval',
  data: [
    { category: 'A', value: 4 },
    { category: 'B', value: 6 },
    { category: 'C', value: 10 },
    { category: 'D', value: 3 },
    { category: 'E', value: 7 },
    { category: 'F', value: 8 },
  ],
  encode: {
    y: 'value',
    color: 'category',
  },
  transform: [{ type: 'stackY' }],
  coordinate: { type: 'theta' },
  scale: {
    color: { range: ['#5b8ff9', '#753d91', '#b03c63', '#d5b471', '#4fb01f', '#608b7d'] },
  },
};

export const LinterPanel = () => {
  const myAdvisor = new Advisor();
  const [lints, setLints] = useState<AdvisorTypes.Lint[]>([]);

  const getLint = () => {
    const myLint = myAdvisor.lint({ spec: errorSpec as AdvisorTypes.Specification });
    setLints(myLint);
  };

  return (
    <div style={{ marginBottom: 20, maxWidth: 1000 }}>
      <Divider orientation="left" plain style={{ fontSize: 20 }}>
        {' '}
        Linter{' '}
      </Divider>
      <Row align="middle">
        <Col span={8}>
          <Chart id={'linter-demo'} spec={errorSpec}>
            {' '}
          </Chart>
        </Col>
        <Col span={4}>
          <div style={{ textAlign: 'center' }}>
            <Button onClick={getLint} style={{ width: 80 }}>
              Lint
            </Button>
          </div>
        </Col>
        <Col span={12}>
          <LintCard lints={lints}></LintCard>
        </Col>
      </Row>
    </div>
  );
};
