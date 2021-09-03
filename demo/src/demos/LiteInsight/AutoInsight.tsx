import React, { useState, useEffect } from 'react';
import { Select, Button, Table } from 'antd';
import { GiftOutlined } from '@ant-design/icons';
// @ts-ignore
import datasets from 'vega-datasets';
import { getDataInsights, InsightInfo, Datum, PatternInfo } from '../../../../packages/lite-insight/src';
import InsightCard from './InsightCard';

const { Option } = Select;

const datasetOptions = ['gapminder', 'burtin', 'crimea', 'unemployment-across-industries', 'population', 'ohlc', 'jobs', 'income'];

export default function App() {
  const [insights, setInsights] = useState<InsightInfo<PatternInfo>[]>([]);
  const [dataset, setDataset] = useState('gapminder');
  const [data, setData] = useState<Datum[]>([]);
  const [tableColumns, setTableColumns] = useState<Datum[]>([]);
  const [dataLoading, setDataLoading] = useState<boolean>(false);
  const [insightLoading, setInsightLoading] = useState<boolean>(false);

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
    const result = getDataInsights(
      data,
      dataset === 'gapminder'
        ? {
            limit: 30,
            measures: [
              { field: 'life_expect', method: 'MEAN' },
              { field: 'pop', method: 'SUM' },
              { field: 'fertility', method: 'MEAN' },
            ],
          }
        : {}
    );
    setInsights(result.insights);
    setInsightLoading(false);
  };

  useEffect(() => {
    fetchDataset();
  }, [dataset]);
  return (
    <>
      <div style={{ padding: 16, display: 'flex', height: 500 }}>
        <div style={{ flex: 1, borderRight: '2px solid #bfbfbf', paddingRight: 20, height: '100%', overflow: 'hidden' }}>
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
          <div style={{ fontSize: 20, fontWeight: 600, margin: 16 }}>Insights</div>
          {insights.map((item, index) => (
            <InsightCard key={index} insight={item} />
          ))}
        </div>
      )}
    </>
  );
}
