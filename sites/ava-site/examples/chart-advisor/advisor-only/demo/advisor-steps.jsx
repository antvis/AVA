import React from 'react';
import ReactDOM from 'react-dom';
import { Menu, Dropdown, Radio } from 'antd';
import { CaretDownOutlined } from '@ant-design/icons';
import { JSONView, TableView, StepBar, ChartView } from 'antv-site-demo-rc';

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

const dataRadioOptions = [
  { label: 'JSON', value: 'JSON' },
  { label: 'Table', value: 'Table' },
];

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      currentStep: 0,
      data: defaultData,
      advices: myAdvisor.advise({ data: defaultData }),
      currentAdvice: 0,
      dataRadioValue: 'Table',
    };

    this.myRef = React.createRef();
  }

  onStepChange = (currentStep) => {
    this.setState({ currentStep });
  };

  onDataRadioChange = (e) => {
    this.setState({
      dataRadioValue: e.target.value,
    });
  };

  onAdviceMenuClick = (e) => {
    const index = parseInt(e.key.split('-')[0], 10);
    this.setState({
      currentAdvice: index,
    });
  };

  render() {
    const { currentStep, advices, currentAdvice, data, dataRadioValue } = this.state;

    const dataContent = (
      <>
        <Radio.Group
          options={dataRadioOptions}
          onChange={this.onDataRadioChange}
          value={dataRadioValue}
          optionType="button"
          buttonStyle="solid"
        />
        {dataRadioValue === 'Table' ? (
          <TableView style={{ padding: 20 }} tableWidth={400} data={data} s2Configs={{ adaptive: true }} />
        ) : (
          <JSONView json={data} />
        )}
      </>
    );
    const advicesMenu = (
      <Menu onClick={this.onAdviceMenuClick} selectedKeys={[this.state.currentAdvice]}>
        {(advices || []).map((item, index) => {
          return <Menu.Item key={`${index}-${item.type}`}>{`${index}: ${item.type}`}</Menu.Item>;
        })}
      </Menu>
    );

    const advicesContent = (
      <>
        <Dropdown overlay={advicesMenu} placement="bottomLeft" trigger={['click']} disabled={!advices}>
          <a className="ant-dropdown-link" onClick={(e) => e.preventDefault()}>
            {!advices ? 'no advice' : `Advice ${this.state.currentAdvice}`} <CaretDownOutlined />
          </a>
        </Dropdown>
        <JSONView json={advices[currentAdvice]} />
      </>
    );

    const specContent = <JSONView json={advices[currentAdvice].spec} />;

    const plotContent = <ChartView chartRef={this.myRef} spec={advices[currentAdvice].spec} />;

    // manifest

    const steps = [
      {
        title: 'Data',
        desc: 'Source data:',
        content: dataContent,
      },
      {
        title: 'Advices',
        desc: 'Advices list recommended from data:',
        content: advicesContent,
      },
      {
        title: 'Spec',
        desc: 'Pick an advice and get its specification.',
        content: specContent,
      },
      {
        title: 'Chart',
        desc: 'Render chart with specification.',
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
