/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Steps, Radio } from 'antd';
import ReactJson from 'react-json-view';
import * as G2Plot from '@antv/g2plot';
import { SheetComponent } from '@antv/s2';
import { getDataInsights } from '@antv/lite-insight';
import { statistics } from '@antv/data-wizard';
import { SmartBoard, SmartBoardDashboard, SmartBoardChartView, insights2Board } from '@antv/smart-board';

const { Step } = Steps;

function g2plotRender(container, type, data, options) {
  const containerDOM = typeof container === 'string' ? document.getElementById(container) : container;
  if (!containerDOM) return null;
  const plot = new G2Plot[type](containerDOM, {
    height: 280,
    data,
    ...options,
  });
  plot.render();
  return plot;
}

const ShowJSON = (json) => (
  <ReactJson src={json} iconStyle name={false} displayObjectSize={false} displayDataTypes={false} />
);

const ShowTable = (data, { height, width }) => {
  const s2DataConfig = { fields: { columns: Object.keys(data[0] || {}) }, data };
  const s2options = { width, height };

  return <SheetComponent dataCfg={s2DataConfig} options={s2options} sheetType="table" themeCfg={{ name: 'simple' }} />;
};

const dataRadioOptions = [
  { label: 'JSON', value: 'JSON' },
  { label: 'Table', value: 'Table' },
];

const App = () => {
  const [insights, setInsights] = useState({});
  const [data, setData] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [dataDisplayType, setDataDisplayType] = useState('Table');
  const [chartGraph, setChartGraph] = useState(null);
  const [chartOrder, setChartOrder] = useState(null);
  const [chartCluster, setChartCluster] = useState(null);

  const fetchDataset = async () => {
    fetch('https://cdn.jsdelivr.net/npm/vega-datasets@2.2.0/data/gapminder.json')
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setData(data);
          const insightResult = getDataInsights(data, {
            limit: 10,
            measures: [
              { field: 'life_expect', method: 'MEAN' },
              { field: 'pop', method: 'SUM' },
              { field: 'fertility', method: 'MEAN' },
            ],
            // 洞察结果中会增加对应的可视化展示方案（基于g2plot）
            visualization: true,
          });
          setInsights(insightResult);
        }
      });
  };

  useEffect(() => {
    fetchDataset();
  }, []);

  useEffect(() => {
    if (insights?.insights) {
      const smartBoard = new SmartBoard(insights2Board(insights.insights));
      setChartGraph(smartBoard.chartGraph);
      setChartOrder(smartBoard.chartOrder('byInsightScore'));
      setChartCluster(smartBoard.chartCluster());
    }
  }, [insights]);

  const dataContent = (
    <>
      <Radio.Group
        options={dataRadioOptions}
        onChange={(e) => setDataDisplayType(e.target.value)}
        value={dataDisplayType}
        optionType="button"
        buttonStyle="solid"
      />
      <div style={{ height: '300px', overflowY: 'scroll', border: '2px solid #eee', padding: '20px' }}>
        {dataDisplayType === 'Table' ? ShowTable(data, { height: 300, width: 700 }) : ShowJSON(data)}
      </div>
    </>
  );

  const insightsContent = (
    <>
      <div style={{ height: '300px', overflowY: 'scroll', border: '2px solid #eee', padding: '20px' }}>
        {ShowJSON(insights)}
      </div>
    </>
  );

  const plotContent = (
    <div className="page">
      <SmartBoardDashboard
        chartList={insights2Board(insights.insights)}
        interactionMode={'defaultMode'}
        chartGraph={chartGraph}
        chartOrder={chartOrder}
        chartCluster={chartCluster}
        ChartView={SmartBoardChartView}
        aggregate={statistics.aggregate}
        g2plotRender={g2plotRender}
      />
    </div>
  );

  const steps = [
    {
      title: 'Data',
      desc: 'Source data:',
      content: dataContent,
    },
    {
      title: 'Insights',
      desc: 'Insights extracted from data:',
      content: insightsContent,
    },
    {
      title: 'Dashboard',
      desc: 'Represent insight with smart-board.',
      content: plotContent,
    },
  ];

  return (
    <>
      <Steps
        type="navigation"
        size="small"
        current={currentStep}
        onChange={setCurrentStep}
        style={{ marginBottom: '8px', boxShadow: '0px -1px 0 0 #e8e8e8 inset' }}
      >
        {steps.map((item) => (
          <Step key={item.title} title={item.title} />
        ))}
      </Steps>

      <p>{steps[currentStep].desc}</p>

      <div className="steps-content" style={{ height: 'calc(100% - 80px)' }}>
        {steps[currentStep].content}
      </div>
    </>
  );
};

ReactDOM.render(<App />, document.getElementById('container'));
