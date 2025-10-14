import React from 'react';

import ReactDOM from 'react-dom';
import { JSONView, ChartView, LintCard, StepBar } from 'antv-site-demo-rc';
import { Advisor } from '@antv/ava';

const myAdvisor = new Advisor();

// contants

const errorSpec = {
  type: 'interval',
  data: [
    { category: 'A', value: 4 },
    { category: 'B', value: 6 },
    { category: 'C', value: 10 },
    { category: 'D', value: 3 },
    { category: 'E', value: 7 },
    { category: 'F', value: 8 },
  ],
  encode: {
    color: 'category',
    y: 'value',
  },
  transform: [{ type: 'stackY' }],
  coordinate: { type: 'theta' },
};

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      currentStep: 0,
      spec: errorSpec,
      problems: myAdvisor.lint({ spec: errorSpec }),
    };

    this.myRef = React.createRef();
  }

  onStepChange = (currentStep) => {
    this.setState({ currentStep });
  };

  render() {
    const { currentStep, spec, problems } = this.state;

    const plotContent = <ChartView chartRef={this.myRef} spec={spec} />;

    const specContent = <JSONView json={spec} />;

    const problemContent = (
      <>
        <LintCard lintProblems={problems} />
        <JSONView json={problems} />
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
        <StepBar current={currentStep} onChange={this.onStepChange} steps={steps} />

        <p>{steps[currentStep].desc}</p>

        <div className="steps-content" style={{ height: 'calc(100% - 80px)' }}>
          {steps[currentStep].content}
        </div>
      </>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('container'));
