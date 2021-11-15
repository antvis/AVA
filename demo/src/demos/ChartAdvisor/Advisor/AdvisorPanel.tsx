import React, { useState } from 'react';
import { Table, Button, Divider, Row, Col } from 'antd';
import { Advice, Advisor } from '@antv/chart-advisor';
import testData from '../data.json';
import { AdviceCard } from './AdviceCard';

export const AdvisorPanel = () => {
  const myAdvisor = new Advisor();
  const [advices, setAdvices] = useState<Advice[]>([]);

  const getAdvicesFromAdvisor = () => {
    const myAdvices: Advice[] = myAdvisor.advise({
      data: testData,
      fields: ['price', 'type'],
      options: { theme: { primaryColor: '#ff9900' } },
    });
    setAdvices(myAdvices);
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
      {/* <h1>Advisor</h1> */}
      <Divider orientation="left" plain style={{ fontSize: 20 }}>
        {' '}
        Advisor{' '}
      </Divider>
      <Row align="middle" justify="space-around">
        <Col span={8}>
          <Table
            rowKey={(_, index) => index}
            size="small"
            style={{ marginLeft: 10, marginRight: 10 }}
            dataSource={testData}
            columns={dataCols}
            pagination={false}
          ></Table>
        </Col>
        <Col span={4}>
          <div style={{ textAlign: 'center' }}>
            <Button onClick={getAdvicesFromAdvisor} style={{ margin: 'auto' }}>
              Advise
            </Button>
          </div>
        </Col>
        <Col span={12}>
          <AdviceCard advices={advices}></AdviceCard>
        </Col>
      </Row>
    </div>
  );
};
