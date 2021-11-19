/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Spin } from 'antd';
import { getDataInsights } from '@antv/lite-insight';
import { SmartBoard, SmartBoardDashboard, insights2Board } from '@antv/smart-board';
import { TableView, StepBar } from 'antv-site-demo-rc';

const App = () => {
  const [insights, setInsights] = useState({});
  const [data, setData] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [smartBoard, setSmartBoard] = useState();
  const [isLoading, setIsLoading] = useState(true);

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
          setIsLoading(false);
        }
      });
  };

  useEffect(() => {
    fetchDataset();
  }, []);

  useEffect(() => {
    if (insights?.insights) {
      const updateSmartBoard = new SmartBoard(insights2Board(insights.insights));
      setSmartBoard(updateSmartBoard);
    }
  }, [insights]);

  const dataContent = <TableView data={data} />;

  const plotContent = (
    <div className="page">
      <SmartBoardDashboard
        chartList={insights2Board(insights.insights)}
        interactionMode={'defaultMode'}
        hasInsight={true}
        chartGraph={smartBoard?.chartGraph}
        chartOrder={smartBoard?.chartOrder('byInsightScore')}
        chartCluster={smartBoard?.chartCluster()}
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
      title: 'Dashboard',
      desc: 'Represent insight with smart-board.',
      content: plotContent,
    },
  ];

  return (
    <>
      <StepBar current={currentStep} onChange={setCurrentStep} steps={steps} />

      <p>{steps[currentStep].desc}</p>

      <div className="steps-content" style={{ height: 'calc(100% - 80px)' }}>
        <Spin spinning={isLoading}>{steps[currentStep].content}</Spin>
      </div>
    </>
  );
};

ReactDOM.render(<App />, document.getElementById('container'));
