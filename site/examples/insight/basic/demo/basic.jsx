import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Spin, Steps } from 'antd';
import { getInsights } from '@antv/ava';
import { JsonView, defaultStyles, collapseAllNested } from 'react-json-view-lite';

const App = () => {
  const [result, setResult] = useState({});
  const [data, setData] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);

  const getMyInsights = async () => {
    fetch('https://cdn.jsdelivr.net/npm/vega-datasets@2.2.0/data/gapminder.json')
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setData(data);
          const insightResult = getInsights(data);
          setResult(insightResult);
          setLoading(false);
        }
      });
  };

  useEffect(() => {
    getMyInsights();
  }, []);

  const dataContent = <JsonView data={data} shouldExpandNode={collapseAllNested} style={defaultStyles} />;

  const insightsContent = <JsonView data={result} shouldExpandNode={collapseAllNested} style={defaultStyles} />;

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
      <div style={{ width: '50%', margin: '0 auto' }}>
        <Steps current={currentStep} onChange={setCurrentStep} items={steps} size="default" />
      </div>
      <p>{steps[currentStep].desc}</p>

      <div className="steps-content" style={{ height: 'calc(100% - 80px)' }}>
        <Spin spinning={loading}>{steps[currentStep].content}</Spin>
      </div>
    </>
  );
};

ReactDOM.render(<App />, document.getElementById('container'));
