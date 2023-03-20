import React, { useMemo, useState, useEffect, createRef } from 'react';

import ReactDOM from 'react-dom';
import { Spin, Tag } from 'antd';
import { getInsights } from '@antv/ava';
import { NarrativeTextVis } from '@antv/ava-react';
import { ChartView, JSONView, TableView, StepBar } from 'antv-site-demo-rc';

const App = () => {
  const data = useMemo(
    () => [
      {
        date: '2019-08-12',
        price: 967.95,
        discount_price: 781.99,
      },
      {
        date: '2019-08-13',
        price: 911.22,
        discount_price: 835.71,
      },
      {
        date: '2019-08-14',
        price: 738.11,
        discount_price: 839.24,
      },
      {
        date: '2019-08-15',
        price: 784.52,
        discount_price: 883.51,
      },
      {
        date: '2019-08-16',
        price: 983.89,
        discount_price: 873.98,
      },
      {
        date: '2019-08-17',
        price: 912.87,
        discount_price: 802.78,
      },
      {
        date: '2019-08-18',
        price: 1153.12,
        discount_price: 807.05,
      },
      {
        date: '2019-08-19',
        price: 1012.87,
        discount_price: 885.12,
      },
      {
        date: '2019-08-20',
        price: 1118.88,
        discount_price: 1018.85,
      },
      {
        date: '2019-08-21',
        price: 1054.53,
        discount_price: 934.49,
      },
      {
        date: '2019-08-22',
        price: 1234.53,
        discount_price: 908.74,
      },
      {
        date: '2019-08-23',
        price: 1312.34,
        discount_price: 930.55,
      },
      {
        date: '2019-08-24',
        price: 825.53,
        discount_price: 978.53,
      },
      {
        date: '2019-08-25',
        price: 1054.53,
        discount_price: 931.47,
      },
      {
        date: '2019-08-26',
        price: 1119.53,
        discount_price: 891,
      },
      {
        date: '2019-08-27',
        price: 1257.68,
        discount_price: 836.41,
      },
    ],
    []
  );
  const [result, setResult] = useState({});
  const [insightLoading, setInsightLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);

  const getMyInsights = async () => {
    if (data) {
      const insightResult = getInsights(data, {
        limit: 60,
        dimensions: [{ fieldName: 'date' }],
        measures: [{ fieldName: 'discount_price', method: 'SUM' }],
        visualization: true,
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

  const plotContent = (
    <div key="plot" style={{ flex: 5, height: '100%' }}>
      {result.insights &&
        result.insights.map((insight) => {
          return insight.visualizationSpecs?.map((spec, index) => {
            const { patternType, chartSpec, narrativeSpec } = spec;
            return (
              <div key={index}>
                <Tag>{patternType}</Tag>
                {narrativeSpec && (
                  <NarrativeTextVis
                    spec={{
                      sections: [{ paragraphs: narrativeSpec }],
                    }}
                  />
                )}
                <ChartView
                  chartRef={createRef()}
                  spec={chartSpec}
                  style={{
                    height: 480,
                  }}
                />
              </div>
            );
          });
        })}
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
