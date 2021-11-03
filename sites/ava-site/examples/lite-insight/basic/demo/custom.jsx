import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Steps, Radio } from 'antd';
import ReactJson from 'react-json-view';
import { SheetComponent } from '@antv/s2';

import { getDataInsights } from '@antv/lite-insight';

const { Step } = Steps;

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

  const fetchDataset = async () => {
    fetch('https://cdn.jsdelivr.net/npm/vega-datasets@2.2.0/data/gapminder.json')
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setData(data);
          const insightResult = getDataInsights(data, {
            // 取前10个洞察
            limit: 10,
            // 自定义指标字段
            measures: [
              { field: 'life_expect', method: 'MEAN' },
              { field: 'pop', method: 'SUM' },
              { field: 'fertility', method: 'MEAN' },
            ],
            // 自定义维度字段
            dimensions: ['country', 'year'],
          });
          setInsights(insightResult);
        }
      });
  };

  useEffect(() => {
    fetchDataset();
  }, []);

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
