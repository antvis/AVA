import React from 'react';
import ReactDOM from 'react-dom';
import { specToG2Plot } from '@antv/antv-spec';
import { colorSimulation, colorToHex, COLOR_BLINDNESS_SIMULATION_TYPES } from '@antv/smart-color';
import { TableView, StepBar } from 'antv-site-demo-rc';

import { Advisor } from '@antv/chart-advisor';

const myAdvisor = new Advisor();

// contants

const defaultData = [
  { year: '2007', sales: 28 },
  { year: '2008', sales: 55 },
  { year: '2009', sales: 43 },
  { year: '2010', sales: 91 },
  { year: '2011', sales: 81 },
  { year: '2012', sales: 53 },
  { year: '2013', sales: 19 },
  { year: '2014', sales: 87 },
  { year: '2015', sales: 52 },
];

const initColor = {
  model: 'rgb',
  value: { r: 126, g: 63, b: 235 },
};

const SIMULATION_TYPES = [...COLOR_BLINDNESS_SIMULATION_TYPES, 'grayscale'];

const initSimMethod = SIMULATION_TYPES[0];

const simulatedColor = colorSimulation(initColor, initSimMethod);

const themeColor = {
  primaryColor: colorToHex(simulatedColor),
};

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      currentStep: 0,
      data: defaultData,
      advices: myAdvisor.advise({
        data: defaultData,
        options: {
          theme: themeColor,
        },
      }),
      currentAdvice: 0,
      colorPick: colorToHex(initColor),
      simMethod: initSimMethod,
    };

    this.canvas = React.createRef(null);
  }

  onStepChange = (currentStep) => {
    this.setState({ currentStep });
  };

  componentDidUpdate() {
    if (this.canvas.current) {
      specToG2Plot(this.state.advices[this.state.currentAdvice].spec, document.getElementById('vis'));
    }
  }

  render() {
    const { currentStep, data } = this.state;

    const dataContent = <TableView data={data} />;

    const plotContent = (
      <div>
        <div id="vis" key="plot" ref={this.canvas} style={{ flex: 5, height: '100%' }}></div>
      </div>
    );

    // manifest

    const steps = [
      {
        title: 'Data',
        desc: 'Source data:',
        content: dataContent,
      },
      {
        title: 'Chart',
        desc: 'Render chart with specified color theme.',
        content: plotContent,
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
