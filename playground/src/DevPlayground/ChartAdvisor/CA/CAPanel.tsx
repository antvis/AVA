import React, { useState } from 'react';

import { Table, Button, Divider, Row, Col } from 'antd';

import { Advisor } from '../../../../../packages/ava/lib';
import testData from '../data.json';

import { CACard } from './CACard';

export const CAPanel = () => {
  const myCA = new Advisor();
  const [results, setResults] = useState([]);

  const getAdvicesFromAdvisor = () => {
    const myAdviseResults = myCA.advise({ data: testData, fields: ['price', 'type'] });
    const myLintResults = myAdviseResults.map((item) => {
      const lints = myCA.lint({ spec: item.spec! });
      return { ...item, lint: lints };
    });
    setResults(myLintResults);
  };

  const dataCols = [
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
    },
  ];

  return (
    <div style={{ marginBottom: 20, maxWidth: 1000 }}>
      <Divider orientation="left" plain style={{ fontSize: 20 }}>
        {' '}
        Advisor and Linter{' '}
      </Divider>
      <Row align="middle" justify="space-around">
        <Col span={8}>
          <Table
            rowKey={(_, index) => index}
            size="small"
            style={{ width: '100%', marginLeft: 10, marginRight: 10 }}
            dataSource={testData}
            columns={dataCols}
            pagination={false}
          ></Table>
        </Col>
        <Col span={4}>
          <div style={{ textAlign: 'center' }}>
            <Button onClick={getAdvicesFromAdvisor} style={{ margin: 'auto' }}>
              Advise and Lint
            </Button>
          </div>
        </Col>
        <Col span={12}>
          <CACard results={results}></CACard>
        </Col>
      </Row>
    </div>
  );
};
