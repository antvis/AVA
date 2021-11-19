import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Spin } from 'antd';
import { getDataInsights } from '@antv/lite-insight';
import { JSONView, TableView, StepBar } from 'antv-site-demo-rc';

const App = () => {
  const [result, setResult] = useState({});
  const [data, setData] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);

  const getInsights = async () => {
    fetch('https://cdn.jsdelivr.net/npm/vega-datasets@2.2.0/data/gapminder.json')
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setData(data);
          const insightResult = getDataInsights(data);
          setResult(insightResult);
          setLoading(false);
        }
      });
  };

  useEffect(() => {
    getInsights();
  }, []);

  const dataContent = <TableView data={data} />;

  const insightsContent = <JSONView json={result} rjvConfigs={{ collapsed: 2 }} />;

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
  ];

  return (
    <>
      <StepBar current={currentStep} onChange={setCurrentStep} steps={steps} />
      <p>{steps[currentStep].desc}</p>

      <div className="steps-content" style={{ height: 'calc(100% - 80px)' }}>
        <Spin spinning={loading}>{steps[currentStep].content}</Spin>
      </div>
    </>
  );
};

ReactDOM.render(<App />, document.getElementById('container'));
