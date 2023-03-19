import React, { useState, useEffect, createRef } from 'react';

import { Select, Button, Table, Tag } from 'antd';
import { GiftOutlined } from '@ant-design/icons';
// @ts-ignore
import datasets from 'vega-datasets';
import { ChartView } from 'antv-site-demo-rc';

import { getInsights, InsightTypes } from '../../../../packages/ava/src';
import { NarrativeTextVis } from '../../../../packages/ava-react/src';

const { Option } = Select;

const datasetOptions = [
  'anomaly',
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
    measures: [{ fieldName: 'discountPrice', method: 'SUM' }],
    impactMeasures: [{ fieldName: 'discountPrice', method: 'COUNT' }],
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
          date: '2019-08-12',
          price: 967.95,
          discountPrice: 781.99,
        },
        {
          date: '2019-08-13',
          price: 911.22,
          discountPrice: 835.71,
        },
        {
          date: '2019-08-14',
          price: 738.11,
          discountPrice: 839.24,
        },
        {
          date: '2019-08-15',
          price: 784.52,
          discountPrice: 883.51,
        },
        {
          date: '2019-08-16',
          price: 983.89,
          discountPrice: 873.98,
        },
        {
          date: '2019-08-17',
          price: 912.87,
          discountPrice: 802.78,
        },
        {
          date: '2019-08-18',
          price: 1153.12,
          discountPrice: 807.05,
        },
        {
          date: '2019-08-19',
          price: 1012.87,
          discountPrice: 885.12,
        },
        {
          date: '2019-08-20',
          price: 1118.88,
          discountPrice: 1018.85,
        },
        {
          date: '2019-08-21',
          price: 1054.53,
          discountPrice: 934.49,
        },
        {
          date: '2019-08-22',
          price: 1234.53,
          discountPrice: 908.74,
        },
        {
          date: '2019-08-23',
          price: 1312.34,
          discountPrice: 930.55,
        },
        {
          date: '2019-08-24',
          price: 825.53,
          discountPrice: 978.53,
        },
        {
          date: '2019-08-25',
          price: 1054.53,
          discountPrice: 931.47,
        },
        {
          date: '2019-08-26',
          price: 1119.53,
          discountPrice: 891,
        },
        {
          date: '2019-08-27',
          price: 1257.68,
          discountPrice: 836.41,
        },
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
              <Button disabled={dataLoading} type="primary" icon={<GiftOutlined />} onClick={() => getDataInsights()}>
                Get Insights!
              </Button>
            </div>
          </div>
        </div>
      </div>
      {insights.length > 0 && (
        <div style={{ borderTop: '1px solid grey' }}>
          {insights.map((insight, insightKey) => (
            <div key={insightKey} style={{ margin: 12, padding: 12, border: '1px solid #ccc' }}>
              {insight.visualizationSpecs?.map((visSpec, visKey) => (
                <div key={visKey}>
                  {insight?.patterns.map((pattern, i) => (
                    <Tag key={i}>{pattern.type}</Tag>
                  ))}
                  {visSpec.narrativeSpec && (
                    <NarrativeTextVis
                      spec={{
                        sections: [{ paragraphs: visSpec.narrativeSpec }],
                      }}
                    />
                  )}
                  <ChartView
                    chartRef={createRef()}
                    spec={visSpec.chartSpec}
                    style={{
                      height: 480,
                    }}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
