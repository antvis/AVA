import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Spin } from 'antd';
import { getDataInsights } from '@antv/lite-insight';
import { InsightCard, JSONView, TableView, StepBar } from 'antv-site-demo-rc';

const App = () => {
  const [data, setData] = useState([]);
  const [result, setResult] = useState({});
  const [insightLoading, setInsightLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);

  const getInsights = async () => {
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
            // the corresponding visualization scheme will be added to the insight results (based on g2plot)
            visualization: true,
          });
          setResult(insightResult);
          setInsightLoading(false);
        }
      });
  };

  useEffect(() => {
    getInsights();
  }, []);

  const dataContent = <TableView data={data} />;

  const insightsContent = <JSONView json={result} rjvConfigs={{ collapsed: 2 }} />;

  const plotContent = (
    <div key="plot" style={{ flex: 5, height: '100%' }}>
      {result.insights &&
        result.insights.map((item, index) => <InsightCard key={index} insightInfo={item} height={400} />)}
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
      title: 'Visualization',
      desc: 'Represent insight with visualization.',
      content: plotContent,
    },
  ];

  return (
    <>
      <StepBar current={currentStep} onChange={setCurrentStep} steps={steps} />

      <p>{steps[currentStep].desc}</p>

      <div style={{ height: 'calc(100% - 80px)' }}>
        <Spin spinning={insightLoading}>{steps[currentStep].content}</Spin>
      </div>
    </>
  );
};

ReactDOM.render(<App />, document.getElementById('container'));
