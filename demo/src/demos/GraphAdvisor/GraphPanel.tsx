import React, { useEffect, useState } from 'react';
import { Select, Row, Col, List } from 'antd';
import { Advice, Advisor } from '@antv/chart-advisor';
import { ExampleDataset } from './SampleData';
import { Graph } from './Graph';

const { Option } = Select;

export const GraphPanel = () => {
  const defaultDataset = ExampleDataset[0];
  const [rawData, setRawData] = useState(defaultDataset?.data);
  const [extra, setExtra] = useState();
  const [specs, setSpecs] = useState([]);

  const myAdvisor = new Advisor();
  const handleDataSelect = (datasetId: any) => {
    const { data } = ExampleDataset.find((item) => item.id === datasetId)!;
    const id2Extra = {
      sankey: {
        childrenKey: 'to',
      },
      table: {
        sourceKey: 'Creditor',
        targetKey: 'Debtor',
      },
    };
    setRawData(data);
    setExtra(id2Extra[datasetId]);
  };

  useEffect(() => {
    const advices = myAdvisor.advise({ data: rawData, options: { extra } });
    setSpecs(advices);
  }, [rawData]);

  return (
    <div className="graph-panel-container">
      <div>
        Dataset:
        <Select onChange={handleDataSelect} defaultValue={defaultDataset?.id} style={{ width: 160 }}>
          {ExampleDataset.map((item) => {
            return (
              <Option value={item.id} key={item.id}>
                {item.name}
              </Option>
            );
          })}
        </Select>
      </div>
      <Row>
        <Col span={10}>
          <div>{JSON.stringify(rawData)}</div>
        </Col>
        <Col span={14}>
          <List
            key={`advice-${+new Date()}`}
            itemLayout="vertical"
            pagination={{
              pageSize: 1,
            }}
            split={false}
            dataSource={specs}
            renderItem={(item: Advice, index) => {
              return (
                <List.Item key={index}>
                  <div style={{ display: 'flex' }}>
                    <div style={{ alignSelf: 'flex-end', width: 150 }}>
                      <div>Type: {item.type}</div>
                      <div>Score: {item.score.toFixed(2)}</div>
                    </div>
                    <Graph id={`advice-${index}`} spec={item.spec}>
                      {' '}
                    </Graph>
                  </div>
                </List.Item>
              );
            }}
          ></List>
        </Col>
      </Row>
    </div>
  );
};
