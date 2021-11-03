/* eslint-disable react/prop-types */
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Steps, Radio, List } from 'antd';
import ReactJson from 'react-json-view';
import * as G2Plot from '@antv/g2plot';
import { SheetComponent } from '@antv/s2';

import { getDataInsights } from '@antv/lite-insight';

const { Step } = Steps;

const g2plotTypeMap = {
  column_chart: 'Column',
  line_chart: 'Line',
  pie_chart: 'Pie',
};

const PlotRender = React.memo((props) => {
  const { data, schema, chartType, caption } = props;
  const container = useRef(null);
  const plotRef = useRef();

  useEffect(() => {
    if (plotRef.current) plotRef.current.destroy();
    const plotType = g2plotTypeMap[chartType];
    const plot = new G2Plot[plotType](container.current, { data, ...schema });
    plot.render();
    plotRef.current = plot;
  }, [chartType]);

  useEffect(() => {
    if (plotRef.current) {
      plotRef.current.update({ data, ...schema });
      plotRef.current.render();
    }
  }, [data, schema]);

  return (
    <div style={{ height: '400px', width: '600px', margin: '24px', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{ height: '32px', lineHeight: '32px', fontSize: 16, fontWeight: 500, marginBottom: 24, marginLeft: 24 }}
      >
        {caption}
      </div>
      <div style={{ flex: 1 }} ref={container}></div>
    </div>
  );
});

const InsightCard = (props) => {
  const { insight } = props;

  const { visualizationSchemas, data } = insight;
  if (!visualizationSchemas) return null;

  const { chartType, chartSchema, caption, insightSummary } = visualizationSchemas[0];

  return (
    <div style={{ padding: 16, display: 'flex', boxShadow: '0px 1px 2px -1px #d9d9d9' }}>
      <div style={{ flex: 'none' }}>
        <PlotRender chartType={chartType} data={data} schema={chartSchema} caption={caption} />
      </div>
      <div style={{ flex: 1, borderLeft: '2px solid #bfbfbf', paddingLeft: 20 }}>
        <List
          itemLayout="horizontal"
          dataSource={insightSummary}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta description={item} />
            </List.Item>
          )}
        />
      </div>
    </div>
  );
};

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
            limit: 10,
            measures: [
              { field: 'life_expect', method: 'MEAN' },
              { field: 'pop', method: 'SUM' },
              { field: 'fertility', method: 'MEAN' },
            ],
            visualization: true,
            // 只提取categoryOutlier类型的洞察
            insightTypes: ['category_outlier'],
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

  const plotContent = (
    <div id="vis" key="plot" style={{ flex: 5, height: '100%' }}>
      {insights.insights && insights.insights.map((item, index) => <InsightCard key={index} insight={item} />)}
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
