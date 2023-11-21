import React, { useState, useEffect, useMemo } from 'react';

import ReactDOM from 'react-dom';
import { Spin } from 'antd';
import { insightPatternsExtractor } from '@antv/ava';
import { JSONView, TableView, StepBar } from 'antv-site-demo-rc';

const App = () => {
  const data = useMemo(
    () => [
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
    ],
    []
  );
  const [result, setResult] = useState([]);
  const [insightLoading, setInsightLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);

  const getMyInsights = async () => {
    if (data) {
      const insightResult = insightPatternsExtractor({
        data,
        dimensions: [{ fieldName: 'date' }],
        measures: [{ fieldName: 'discount_price', method: 'SUM' }],
        insightType: 'time_series_outlier',
        options: {
          dataValidation: true,
          algorithmParameter: {
            outlier: {
              method: 'IQR',
              iqrK: 1.5,
            },
          },
        },
      });
      setResult(insightResult);
      setInsightLoading(false);
    }
  };

  useEffect(() => {
    getMyInsights();
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
        <Spin spinning={insightLoading}>{steps[currentStep].content}</Spin>
      </div>
    </>
  );
};

ReactDOM.render(<App />, document.getElementById('container'));
