import React from 'react';
import ReactDOM from 'react-dom';
import { specToG2Plot } from '@antv/antv-spec';
import { colorToHex } from '@antv/smart-color';
import { TableView, StepBar } from 'antv-site-demo-rc';

import { Advisor } from '@antv/chart-advisor';

const myAdvisor = new Advisor();

// contants

const defaultData = [
  { type: '石油', value: 1200 },
  { type: '电子', value: 250 },
  { type: '机械', value: 180 },
  { type: '食物', value: 150 },
  { type: '服饰', value: 100 },
];

const initColor = {
  model: 'rgb',
  value: { r: 103, g: 142, b: 242 },
};

const setColors = {
  /**
   * `themeColor`: color in Hex string
   * theme of SmartColor mode
   * default is lite blue
   */
  themeColor: colorToHex(initColor),
  /**
   * `colorSchemeType`: color generation type
   * contains discrete and categorical types
   * discrete: 'monochromatic', 'analogous'
   * categorical: 'polychromatic', 'split-complementary', 'triadic', 'tetradic'
   * default value is 'monochromatic' or 'polychromatic' based on data type
   */
  colorSchemeType: 'polychromatic',
  /**
   * `simulationType`: color simulation type
   * employed for color blindness and grayscale]
   * default value is 'normal'
   * options are listed as follows:
   * 'normal', 'protanomaly', 'deuteranomaly', 'tritanomaly',
   * 'protanopia', 'deuteranopia', 'tritanopia',
   * 'achromatomaly', 'achromatopsia'
   */
  simulationType: 'protanomaly',
};

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      currentStep: 0,
      data: defaultData,
      advices: myAdvisor.advise({
        data: defaultData,
        /**
         * `smartColor`: SmartColor mode on/off
         * SmartColor mode contains default color options
         */
        smartColor: true,
        /**
         * `colorOptions`: SmartColor options
         * This variable is optional for SmartColor mode
         */
        colorOptions: setColors,
      }),
      currentAdvice: 0,
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

    const plotContent = <div id="vis" key="plot" ref={this.canvas} style={{ flex: 5, height: '100%' }}></div>;

    // manifest

    const steps = [
      {
        title: 'Data',
        desc: 'Source data:',
        content: dataContent,
      },
      {
        title: 'Chart',
        desc: 'Render chart with SmartColor.',
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
