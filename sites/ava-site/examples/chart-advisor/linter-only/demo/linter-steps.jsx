import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Steps, List } from 'antd';
import { specToG2Plot } from '@antv/antv-spec';
import ReactJson from 'react-json-view';

import { Linter } from '@antv/chart-advisor';

const { Step } = Steps;

const ShowJSON = (json) => (
  <ReactJson src={json} iconStyle name={false} displayObjectSize={false} displayDataTypes={false} />
);

const Chart = ({ id, spec }) => {
  useEffect(() => {
    specToG2Plot(spec, document.getElementById(id));
  });

  return <div id={id} style={{ width: '100%', height: 200, margin: 'auto' }}></div>;
};

const LintCard = ({ lints }) => {
  return (
    <List
      key={`lint-${+new Date()}`}
      itemLayout="vertical"
      pagination={{ pageSize: 1 }}
      dataSource={lints}
      split={false}
      renderItem={(item, index) => {
        return (
          <List.Item key={index}>
            <strong style={{ fontSize: 18 }}>Error ID: {item.id}</strong>
            <div>Error Type: {item.type}</div>
            <div>Score: {item.score}</div>
            <div>docs: {item.docs.lintText}</div>
          </List.Item>
        );
      }}
    ></List>
  );
};

const myLinter = new Linter();

// contants

const errorSpec = {
  basis: {
    type: 'chart',
  },
  data: {
    type: 'json-array',
    values: [
      { category: 'A', value: 4 },
      { category: 'B', value: 6 },
      { category: 'C', value: 10 },
      { category: 'D', value: 3 },
      { category: 'E', value: 7 },
      { category: 'F', value: 8 },
    ],
  },
  layer: [
    {
      mark: 'arc',
      encoding: {
        theta: { field: 'value', type: 'quantitative' },
        color: {
          field: 'category',
          type: 'nominal',
          scale: { range: ['#5b8ff9', '#753d91', '#b03c63', '#d5b471', '#4fb01f', '#608b7d'] },
        },
      },
    },
  ],
};

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      currentStep: 0,
      spec: errorSpec,
      problems: myLinter.lint({ spec: errorSpec }),
    };
  }

  onStepChange = (currentStep) => {
    this.setState({ currentStep });
  };

  render() {
    const { currentStep, spec, problems } = this.state;

    const plotContent = <Chart id={'linter-demo'} spec={spec} />;

    const specContent = (
      <div style={{ height: '300px', overflowY: 'scroll', border: '2px solid #eee', padding: '20px' }}>
        {ShowJSON(spec)}
      </div>
    );

    const problemContent = (
      <>
        <LintCard lints={problems} />
        <div style={{ height: '300px', overflowY: 'scroll', border: '2px solid #eee', padding: '20px' }}>
          {ShowJSON(problems)}
        </div>
      </>
    );

    // manifest

    const steps = [
      {
        title: 'Chart',
        desc: 'The design of this chart has some flaws:',
        content: plotContent,
      },
      {
        title: 'Spec',
        desc: 'You can get the specification of the chart if it is drawn with AntV.',
        content: specContent,
      },
      {
        title: 'Problems',
        desc: 'Linter will show you the problems:',
        content: problemContent,
      },
    ];

    return (
      <>
        <Steps
          type="navigation"
          size="small"
          current={currentStep}
          onChange={this.onStepChange}
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
  }
}

ReactDOM.render(<App />, document.getElementById('container'));
