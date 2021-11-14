import React from 'react';
import ReactDOM from 'react-dom';
import { Steps, Radio } from 'antd';
import { specToG2Plot } from '@antv/antv-spec';
import ReactJson from 'react-json-view';
import { SheetComponent } from '@antv/s2';
import { colorToHex } from '@antv/smart-color';

import { Advisor } from '@antv/chart-advisor';

const { Step } = Steps;

const ShowJSON = (json) => (
  <ReactJson src={json} iconStyle name={false} displayObjectSize={false} displayDataTypes={false} />
);

const ShowTable = (data, { height, width }) => {
  const s2DataConfig = { fields: { columns: Object.keys(data[0]) }, data };
  const s2options = { width, height };

  return <SheetComponent dataCfg={s2DataConfig} options={s2options} sheetType="table" themeCfg={{ name: 'simple' }} />;
};

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

const dataRadioOptions = [
  { label: 'JSON', value: 'JSON' },
  { label: 'Table', value: 'Table' },
];

const initColor = {
  model: 'rgb',
  value: { r: 103, g: 142, b: 242 },
};

const setColors = {
  themeColor: colorToHex(initColor),
  colorSchemeType: 'monochromatic',
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
         * SmartColor mode includes default color options
         */
        smartColor: true,
        /**
         * `colorOptions`: SmartColor options
         * This variable is optional for SmartColor mode
         */
        colorOptions: setColors,
      }),
      currentAdvice: 0,
      dataRadioValue: 'Table',
    };

    this.canvas = React.createRef(null);
  }

  onStepChange = (currentStep) => {
    this.setState({ currentStep });
  };

  onDataRadioChange = (e) => {
    this.setState({
      dataRadioValue: e.target.value,
    });
  };

  componentDidUpdate() {
    if (this.canvas.current) {
      specToG2Plot(this.state.advices[this.state.currentAdvice].spec, document.getElementById('vis'));
    }
  }

  render() {
    const { currentStep, data, dataRadioValue } = this.state;

    const dataContent = (
      <>
        <Radio.Group
          options={dataRadioOptions}
          onChange={this.onDataRadioChange}
          value={dataRadioValue}
          optionType="button"
          buttonStyle="solid"
        />
        <div style={{ height: '300px', overflowY: 'scroll', border: '2px solid #eee', padding: '20px' }}>
          {dataRadioValue === 'Table' ? ShowTable(data, { height: 300, width: 300 }) : ShowJSON(data)}
        </div>
      </>
    );

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
