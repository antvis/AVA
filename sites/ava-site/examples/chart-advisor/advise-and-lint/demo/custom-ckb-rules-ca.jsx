import React, { useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { ChartView, JSONView, StepBar, TableView, PagList } from 'antv-site-demo-rc';

// import
import { ChartAdvisor } from '@antv/chart-advisor';

// contants

const trickyData = [
  { field1: 'A', field2: 10 },
  { field1: 'B', field2: 10 },
  { field1: 'C', field2: 10 },
];

// custom chart
const ironBallChart = {
  id: 'ironball_chart',
  name: 'IronBall Chart',
  alias: ['solidball'],
  family: ['PieCharts'],
  def: 'A funny chart.',
  purpose: ['Comparison'],
  coord: ['Cartesian2D'],
  category: ['Statistic'],
  shape: ['Round'],
  dataPres: [
    { minQty: 1, maxQty: '*', fieldConditions: ['Nominal'] },
    { minQty: 1, maxQty: '*', fieldConditions: ['Interval'] },
  ],
  channel: ['Angle', 'Area', 'Color'],
  recRate: 'Use with Caution',
};

// custom chart to spec logic
const toIronball = (data, dataProps) => {
  const fieldInterval = dataProps.find((field) => field.levelOfMeasurements.includes('Interval'));
  const fieldNominal = dataProps.find((field) => field.levelOfMeasurements.includes('Nominal'));

  if (!fieldInterval) return null;

  const spec = {
    basis: {
      type: 'chart',
    },
    data: {
      type: 'json-array',
      values: data,
    },
    layer: [
      {
        mark: 'arc',
        encoding: {
          theta: {
            field: fieldInterval.name,
            type: 'quantitative',
          },
        },
      },
    ],
  };

  if (fieldNominal) {
    spec.layer[0].encoding.color = {
      field: fieldNominal.name,
      type: 'quantitative',
      scale: {
        range: ['#686971'],
      },
    };
  }

  return spec;
};

ironBallChart.toSpec = toIronball;

// custom CKB config
const myCKBCfg = {
  custom: { ironball_chart: ironBallChart },
};

// custom rule
const myRule = {
  id: 'same-value-ironball',
  type: 'SOFT',
  docs: {
    lintText: 'I just like ironball while values of measure are all same.',
  },
  trigger: (args) => {
    const { chartType } = args;
    return chartType === 'ironball_chart';
  },
  validator: (args) => {
    let result = 1;
    const { dataProps } = args;
    const measureFieldProps = dataProps.find((field) => field.levelOfMeasurements.includes('Interval'));

    if (!measureFieldProps || measureFieldProps.distinct !== 1) {
      result = 0;
    }
    return result;
  },
};

// custom rule Config
const myRuleCfg = {
  custom: {
    'same-value-ironball': myRule,
  },
};

// usage
const myChartAdvisor = new ChartAdvisor({ ckbCfg: myCKBCfg, ruleCfg: myRuleCfg });

const results = myChartAdvisor.advise({ data: trickyData });

const App = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const myRef = useRef();

  const onStepChange = (step) => {
    setCurrentStep(step);
  };

  const ckbContent = (
    <>
      const myCKBCfg =
      <JSONView json={myCKBCfg} rjvConfigs={{ collapsed: 3 }} />
    </>
  );

  const ruleContent = (
    <>
      const myRuleCfg =
      <JSONView json={myRuleCfg} rjvConfigs={{ collapsed: 3 }} />
    </>
  );

  const resultContent = (
    <>
      data:
      <TableView data={trickyData} s2Configs={{ adaptive: true }} tableWidth={260} style={{ height: 140 }} />
      <br />
      results:
      <PagList
        data={results}
        renderItem={(item) => <JSONView json={item} style={{ height: 300 }} rjvConfigs={{ collapsed: 2 }} />}
      />
      <br />
      top1 chart:
      <ChartView chartRef={myRef} spec={results[0].spec} />
      <br />
    </>
  );

  const steps = [
    {
      title: 'myCKB',
      desc: 'Define your chart as a CKB object. Define the `toSpec` function to compile that chart. Add your custom chart to CKB.',
      content: ckbContent,
    },
    {
      title: 'myRules',
      desc: 'Define your rule and add it into Advisor.',
      content: ruleContent,
    },
    {
      title: 'result',
      desc: 'Results of your custom system:',
      content: resultContent,
    },
  ];

  return (
    <>
      <StepBar current={currentStep} onChange={onStepChange} steps={steps} />

      <p>{steps[currentStep].desc}</p>

      <div className="steps-content" style={{ height: 'calc(100% - 80px)' }}>
        {steps[currentStep].content}
      </div>
    </>
  );
};

ReactDOM.render(<App />, document.getElementById('container'));
