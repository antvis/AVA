import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Select, Space, Row, Col } from 'antd';
import Thumbnails from '@antv/thumbnails';
import { dataToDataProps, dataPropsToAdvices, specToLibConfig, g2plotRender } from '@antv/chart-advisor';

const charts = Object.keys(Thumbnails);
const { Option } = Select;

const App = () => {
  const [data, setData] = useState('yearmonth_gdp_city');
  const [current, setCurrent] = useState();
  const [advices, setAdvices] = useState([]);
  const canvas = useRef();

  useEffect(() => {
    const chartData = getData(data);

    // step 1: data -> data props
    const dataProps = dataToDataProps(chartData);
    console.log('dataProps: ', dataProps);

    // step 2: data props -> Advices( chart type + vega lite specs)
    const advices = dataPropsToAdvices(dataProps);
    console.log('advices: ', advices);

    setAdvices(advices);
    setCurrent(advices[0].type);
  }, [data]);

  useEffect(() => {
    const chartData = getData(data);
    if (current && canvas.current) {
      // step 3: vega lite spec -> lib config
      const typeSpec = advices.find((s) => s.type === current);
      console.log('typeSpec: ', typeSpec);

      // step 4: lib config -> chart render & return instance
      const libConfig = specToLibConfig(typeSpec);
      console.log('libConfig: ', libConfig);

      canvas.current.innerHTML = null;
      // step 5: render
      g2plotRender(canvas.current, chartData, libConfig);
    }
  }, [data, current]);

  const recommend = advices.map((i) => i.type);
  return (
    <Space direction="vertical" size="large">
      <Space>
        <span>Data Source:</span>
        <Select
          value={data}
          onChange={(v) => {
            setData(v);
          }}
        >
          <Option value="yearmonth_gdp_city">yearmonth_gdp_city</Option>
          <Option value="region_sales">region_sales</Option>
          <Option value="region_cat_sales">region_cat_sales</Option>
        </Select>
      </Space>
      <Row>
        <Col span={6}>
          {charts.map((chart) => (
            <img
              src={Thumbnails[chart].url}
              key={chart}
              style={{
                margin: 4,
                border: chart === current ? '2px dashed #873bf4' : '1px solid #999',
                width: 56,
                borderRadius: 2,
                opacity: recommend.indexOf(chart) > -1 ? 1 : 0.1,
                cursor: recommend.indexOf(chart) > -1 ? 'pointer' : 'not-allowed',
              }}
              onClick={() => {
                if (recommend.indexOf(chart) > -1) {
                  setCurrent(chart);
                }
              }}
            />
          ))}
        </Col>
        <Col span={18}>
          <div ref={canvas} style={{ minHeight: 300 }} />
        </Col>
      </Row>
    </Space>
  );
};

ReactDOM.render(<App />, document.getElementById('container'));

function getData(series) {
  const yearmonth_gdp_city = [
    {
      yearmonth: '2019-03',
      gdp: 385,
      city: 'Paris',
    },
    {
      yearmonth: '2019-04',
      gdp: 888,
      city: 'Paris',
    },
    {
      yearmonth: '2019-05',
      gdp: 349,
      city: 'Paris',
    },
    {
      yearmonth: '2019-06',
      gdp: 468,
      city: 'Paris',
    },
    {
      yearmonth: '2019-07',
      gdp: 477,
      city: 'Paris',
    },
    {
      yearmonth: '2019-03',
      gdp: 291,
      city: 'London',
    },
    {
      yearmonth: '2019-04',
      gdp: 484,
      city: 'London',
    },
    {
      yearmonth: '2019-05',
      gdp: 293,
      city: 'London',
    },
    {
      yearmonth: '2019-06',
      gdp: 147,
      city: 'London',
    },
    {
      yearmonth: '2019-07',
      gdp: 618,
      city: 'London',
    },
  ];

  const region_sales = [
    { 地区: '华东', 销售额: 4684506.442 },
    { 地区: '中南', 销售额: 4137415.0929999948 },
    { 地区: '东北', 销售额: 2681567.469000001 },
    { 地区: '华北', 销售额: 2447301.017000004 },
    { 地区: '西北', 销售额: 815039.5959999998 },
    { 地区: '西南', 销售额: 1303124.508000002 },
  ];

  const region_cat_sales = [
    {
      地区: '华东',
      细分: '公司',
      销售额: 1454715.807999998,
    },
    {
      地区: '华东',
      细分: '消费者',
      销售额: 2287358.261999998,
    },
    {
      地区: '中南',
      细分: '公司',
      销售额: 1335665.3239999984,
    },
    {
      地区: '中南',
      细分: '消费者',
      销售额: 2057936.7620000008,
    },
    {
      地区: '东北',
      细分: '公司',
      销售额: 834842.827,
    },
    {
      地区: '东北',
      细分: '消费者',
      销售额: 1323985.6069999991,
    },
    {
      地区: '华北',
      细分: '公司',
      销售额: 804769.4689999995,
    },
    {
      地区: '华北',
      细分: '消费者',
      销售额: 1220430.5610000012,
    },
    {
      地区: '西南',
      细分: '公司',
      销售额: 469341.684,
    },
    {
      地区: '西南',
      细分: '消费者',
      销售额: 677302.8919999995,
    },
    {
      地区: '西北',
      细分: '公司',
      销售额: 253458.1840000001,
    },
    {
      地区: '西北',
      细分: '消费者',
      销售额: 458058.1039999998,
    },
  ];

  if (series === 'yearmonth_gdp_city') return yearmonth_gdp_city;
  if (series === 'region_sales') return region_sales;
  if (series === 'region_cat_sales') return region_cat_sales;
}
