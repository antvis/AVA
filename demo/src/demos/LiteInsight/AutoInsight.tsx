import React, { useState, useEffect } from 'react';
import { Select, Button, Table, Row, Col, Form, Switch } from 'antd';
import { GiftOutlined } from '@ant-design/icons';
// @ts-ignore
import datasets from 'vega-datasets';
import { InsightCard } from 'antv-site-demo-rc';
import { getDataInsightsAsync, InsightInfo, Datum, PatternInfo } from '@antv/lite-insight';

const { Option } = Select;

const datasetOptions = [
  'gapminder',
  'burtin',
  'crimea',
  'unemployment-across-industries',
  'population',
  'ohlc',
  'jobs',
  'income',
];

const datasetConfigs = {
  gapminder: {
    limit: 30,
    measures: [
      { field: 'life_expect', method: 'MEAN' },
      { field: 'pop', method: 'SUM' },
      { field: 'fertility', method: 'MEAN' },
    ],
    impactMeasures: [
      { field: 'life_expect', method: 'COUNT' },
      { field: 'pop', method: 'COUNT' },
      { field: 'fertility', method: 'COUNT' },
    ],
  },
  jobs: {
    limit: 60,
    dimensions: ['sex', 'year', 'job'],
    measures: [{ field: 'count', method: 'SUM' }],
    impactMeasures: [{ field: 'count', method: 'COUNT' }],
  },
  'unemployment-across-industries': {
    limit: 60,
    dimensions: ['series', 'year', 'month', 'date'],
    measures: [
      { field: 'count', method: 'SUM' },
      { field: 'rate', method: 'SUM' },
    ],
    impactMeasures: [{ field: 'count', method: 'COUNT' }],
  },
  income: {
    limit: 30,
    dimensions: ['name', 'region', 'group'],
    measures: [
      { field: 'pct', method: 'SUM' },
      { field: 'total', method: 'SUM' },
      { field: 'id', method: 'SUM' },
    ],
    impactMeasures: [{ field: 'pct', method: 'COUNT' }],
  },
  // mock url: https://gw.alipayobjects.com/os/antfincdn/iee8e%26sH%26O/games.json
  games: {
    dimensions: ['Platform', 'Year', 'Genre', 'Publisher'],
    impactMeasures: [{ field: 'NA_Sales', method: 'COUNT' }],
  },
};

export default function App() {
  const [insights, setInsights] = useState<InsightInfo<PatternInfo>[]>([]);
  const [dataset, setDataset] = useState('gapminder');
  const [data, setData] = useState<Datum[]>([]);
  const [tableColumns, setTableColumns] = useState<Datum[]>([]);
  const [dataLoading, setDataLoading] = useState<boolean>(false);
  const [insightLoading, setInsightLoading] = useState<boolean>(false);
  const [showTextSchema, setShowTextSchema] = useState<boolean>(false);

  const fetchDataset = async () => {
    const datasetName = `${dataset}.json`;
    setDataLoading(true);
    const data = await datasets[datasetName]();
    if (data) {
      const columns = Object.keys(data?.[0] || {}).map((item, index) => ({
        title: item,
        dataIndex: item,
        key: index,
        width: 150,
      }));
      setData(data);
      setTableColumns(columns);
      setDataLoading(false);
    }
  };

  const getInsights = async () => {
    setInsightLoading(true);
    getDataInsightsAsync(data, { ...(datasetConfigs[dataset] ?? {}), visualization: true })
      .then((res) => {
        if (res?.insights) setInsights(res.insights);
      })
      .finally(() => {
        setInsightLoading(false);
      });
  };

  useEffect(() => {
    fetchDataset();
  }, [dataset]);
  return (
    <>
      <div style={{ padding: 16, display: 'flex', height: 500 }}>
        <div
          style={{ flex: 1, borderRight: '2px solid #bfbfbf', paddingRight: 20, height: '100%', overflow: 'hidden' }}
        >
          <Table style={{ height: '100%' }} dataSource={data} columns={tableColumns} scroll={{ x: true, y: 360 }} />
        </div>
        <div style={{ flex: 'none', width: 200 }}>
          <div style={{ display: 'flex', marginTop: 180, flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ marginBottom: 20 }}>
              Dataset:
              <Select
                loading={insightLoading}
                value={dataset}
                style={{ width: 120, marginLeft: 12 }}
                onChange={(v) => setDataset(v as string)}
              >
                {datasetOptions.map((item) => (
                  <Option value={item} key={item}>
                    {item}
                  </Option>
                ))}
              </Select>
            </div>
            <div>
              <Button disabled={dataLoading} type="primary" icon={<GiftOutlined />} onClick={getInsights}>
                Get Insights!
              </Button>
            </div>
          </div>
        </div>
      </div>
      {insights.length > 0 && (
        <div style={{ borderTop: '1px solid grey' }}>
          <Row justify="space-between" style={{ fontSize: 20, fontWeight: 600, margin: 16 }}>
            <Col>Insights</Col>
            <Col>
              <Form.Item label="Use Text Plugin">
                <Switch checked={showTextSchema} onChange={setShowTextSchema} />
              </Form.Item>
            </Col>
          </Row>
          {insights.map((item, index) => (
            <InsightCard key={index} insightInfo={item as any} height={400} />
          ))}
        </div>
      )}
    </>
  );
}
