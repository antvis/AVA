import React, { useState, useEffect } from 'react';

import { Select, Button, Table, Col, Row } from 'antd';
import { GiftOutlined } from '@ant-design/icons';
// @ts-ignore
import datasets from 'vega-datasets';

import { InsightCard } from '../../../../packages/ava-react/src';
import { getInsights, InsightTypes } from '../../../../packages/ava/lib';

const { Option } = Select;

const datasetOptions = [
  'anomaly',
  'majority',
  'changePoint',
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
      { fieldName: 'life_expect', method: 'MEAN' },
      { fieldName: 'pop', method: 'SUM' },
      { fieldName: 'fertility', method: 'MEAN' },
    ],
    impactMeasures: [
      { fieldName: 'life_expect', method: 'COUNT' },
      { fieldName: 'pop', method: 'COUNT' },
      { fieldName: 'fertility', method: 'COUNT' },
    ],
  },
  jobs: {
    limit: 60,
    dimensions: [{ fieldName: 'sex' }, { fieldName: 'year' }, { fieldName: 'job' }],
    measures: [{ fieldName: 'count', method: 'SUM' }],
    impactMeasures: [{ fieldName: 'count', method: 'COUNT' }],
  },
  'unemployment-across-industries': {
    limit: 60,
    dimensions: [{ fieldName: 'series' }, { fieldName: 'year' }, { fieldName: 'month' }, { fieldName: 'date' }],
    measures: [
      { fieldName: 'count', method: 'SUM' },
      { fieldName: 'rate', method: 'SUM' },
    ],
    impactMeasures: [{ fieldName: 'count', method: 'COUNT' }],
  },
  income: {
    limit: 30,
    dimensions: [{ fieldName: 'name' }, { fieldName: 'region' }, { fieldName: 'group' }],
    measures: [
      { fieldName: 'pct', method: 'SUM' },
      { fieldName: 'total', method: 'SUM' },
      { fieldName: 'id', method: 'SUM' },
    ],
    impactMeasures: [{ fieldName: 'pct', method: 'COUNT' }],
  },
  // mock url: https://gw.alipayobjects.com/os/antfincdn/iee8e%26sH%26O/games.json
  games: {
    dimensions: [{ fieldName: 'Platform' }, { fieldName: 'Year' }, { fieldName: 'Genre' }, { fieldName: 'Publisher' }],
    impactMeasures: [{ fieldName: 'NA_Sales', method: 'COUNT' }],
  },
  anomaly: {
    limit: 60,
    dimensions: [{ fieldName: 'date' }],
    measures: [{ fieldName: 'discount_price', method: 'SUM' }],
    visualization: true,
  },
};

export default function App() {
  const [insights, setInsights] = useState<InsightTypes.InsightInfo<InsightTypes.PatternInfo>[]>([]);
  const [dataset, setDataset] = useState('anomaly');
  const [data, setData] = useState<InsightTypes.Datum[]>([]);
  const [tableColumns, setTableColumns] = useState<InsightTypes.Datum[]>([]);
  const [dataLoading, setDataLoading] = useState<boolean>(false);
  const [insightLoading, setInsightLoading] = useState<boolean>(false);

  const fetchDataset = async () => {
    let data;
    if (dataset === 'anomaly') {
      data = [
        {
          date: '2019-08-01',
          discount_price: 727.12,
        },
        {
          date: '2019-08-02',
          discount_price: 729.59,
        },
        {
          date: '2019-08-03',
          discount_price: 730.21,
        },
        {
          date: '2019-08-04',
          discount_price: 732.11,
        },
        {
          date: '2019-08-05',
          discount_price: 733.22,
        },
        {
          date: '2019-08-06',
          discount_price: 741.19,
        },
        {
          date: '2019-08-07',
          discount_price: 742.37,
        },
        {
          date: '2019-08-08',
          discount_price: 752.34,
        },
        {
          date: '2019-08-09',
          discount_price: 761.12,
        },
        {
          date: '2019-08-10',
          discount_price: 783.99,
        },
        {
          date: '2019-08-11',
          discount_price: 791.23,
        },
        {
          date: '2019-08-12',
          discount_price: 781.99,
        },
        {
          date: '2019-08-13',
          discount_price: 835.71,
        },
        {
          date: '2019-08-14',
          discount_price: 839.24,
        },
        {
          date: '2019-08-15',
          discount_price: 883.51,
        },
        {
          date: '2019-08-16',
          discount_price: 873.98,
        },
        {
          date: '2019-08-17',
          discount_price: 802.78,
        },
        {
          date: '2019-08-18',
          discount_price: 807.05,
        },
        {
          date: '2019-08-19',
          discount_price: 885.12,
        },
        {
          date: '2019-08-20',
          discount_price: 1018.85,
        },
        {
          date: '2019-08-21',
          discount_price: 934.49,
        },
        {
          date: '2019-08-22',
          discount_price: 908.74,
        },
        {
          date: '2019-08-23',
          discount_price: 930.55,
        },
        {
          date: '2019-08-24',
          discount_price: 978.53,
        },
        {
          date: '2019-08-25',
          discount_price: 931.47,
        },
        {
          date: '2019-08-26',
          discount_price: 891,
        },
        {
          date: '2019-08-27',
          discount_price: 836.41,
        },
        {
          date: '2019-08-28',
          discount_price: 826.11,
        },
        {
          date: '2019-08-29',
          discount_price: 820.11,
        },
        {
          date: '2019-08-30',
          discount_price: 811.11,
        },
      ];
    } else if (dataset === 'majority') {
      data = [
        { product: 'apple', yield: 160 },
        { product: 'banana', yield: 10 },
        { product: 'watermelon', yield: 5 },
        { product: 'orange', yield: 1 },
        { product: 'eggplant', yield: 2 },
        { product: 'egg', yield: 4 },
        { product: 'celery', yield: 9 },
        { product: 'mango', yield: 7 },
        { product: 'persimmon', yield: 8.5 },
        { product: 'tomato', yield: 5 },
      ];
    } else if (dataset === 'changePoint') {
      data = [
        { year: '2000', value: 0.3 },
        { year: '2001', value: 0.3 },
        { year: '2002', value: -0.5 },
        { year: '2003', value: 0.05 },
        { year: '2004', value: -0.2 },
        { year: '2005', value: 0.4 },
        { year: '2006', value: 9 },
        { year: '2007', value: 7 },
        { year: '2008', value: 8.5 },
        { year: '2009', value: 5 },
      ];
    } else {
      const datasetName = `${dataset}.json`;
      setDataLoading(true);
      data = await datasets[datasetName]();
    }
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

  const getDataInsights = async () => {
    setInsightLoading(true);
    const { insights } = getInsights(data, {
      ...(datasetConfigs[dataset] ?? {}),
      visualization: { lang: 'zh-CN' },
    });

    if (insights) {
      setInsights(insights);
      setInsightLoading(false);
    }
  };

  useEffect(() => {
    fetchDataset();
  }, [dataset]);
  return (
    <>
      <div style={{ padding: 16, display: 'flex', height: 520, border: '1px solid rgb(238, 238, 238)' }}>
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
                onChange={(v) => setDataset(v)}
              >
                {datasetOptions.map((item) => (
                  <Option value={item} key={item}>
                    {item}
                  </Option>
                ))}
              </Select>
            </div>
            <div>
              <Button disabled={dataLoading} type="primary" icon={<GiftOutlined />} onClick={() => getDataInsights()}>
                Get Insights!
              </Button>
            </div>
          </div>
        </div>
      </div>
      {insights.length > 0 && (
        <div style={{ borderTop: '1px solid grey' }}>
          <Row justify="space-around">
            {insights.map((insightInfo, index) => {
              return (
                <Col key={index}>
                  <InsightCard insightInfo={insightInfo} styles={{ width: 400 }} />
                </Col>
              );
            })}
          </Row>
        </div>
      )}
    </>
  );
}
