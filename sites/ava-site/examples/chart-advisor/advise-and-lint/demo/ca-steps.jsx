import React from 'react';
import ReactDOM from 'react-dom';
import { Menu, Dropdown, Radio } from 'antd';
import { CaretDownOutlined } from '@ant-design/icons';
import { JSONView, TableView, ChartView, LintCard, StepBar } from 'antv-site-demo-rc';

// import
import { ChartAdvisor } from '@antv/chart-advisor';

const myChartAdvisor = new ChartAdvisor();

// contants

const defaultData = [
  { price: 100, type: 'A' },
  { price: 120, type: 'B' },
  { price: 150, type: 'C' },
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
      results: myChartAdvisor.advise({ data: defaultData }),
      currentResult: 0,
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
      currentResult: index,
    });
  };

  render() {
    const { currentStep, results, currentResult, data, dataRadioValue } = this.state;

    const dataContent = (
      <>
        <Radio.Group
          options={dataRadioOptions}
          onChange={this.onDataRadioChange}
          value={dataRadioValue}
          optionType="button"
          buttonStyle="solid"
        />
        {dataRadioValue === 'Table' ? <TableView data={data} tableWidth={200} /> : <JSONView json={data} />}
      </>
    );
    const advicesMenu = (
      <Menu onClick={this.onAdviceMenuClick} selectedKeys={[currentResult]}>
        {(results || []).map((item, index) => {
          return <Menu.Item key={`${index}-${item.type}`}>{`${index}: ${item.type}`}</Menu.Item>;
        })}
      </Menu>
    );

    const resultContent = (
      <>
        <Dropdown overlay={advicesMenu} placement="bottomLeft" trigger={['click']} disabled={!results}>
          <a className="ant-dropdown-link" onClick={(e) => e.preventDefault()}>
            {!results ? 'no advice' : `Advice ${currentResult}`} <CaretDownOutlined />
          </a>
        </Dropdown>
        <JSONView json={results[currentResult]} />
      </>
    );

    const plotContent = (
      <>
        <LintCard lintProblems={results[currentResult].lint} />
        <ChartView chartRef={this.myRef} spec={results[currentResult].spec} />
      </>
    );

    // manifest

    const steps = [
      {
        title: 'Data',
        desc: 'Source data:',
        content: dataContent,
      },
      {
        title: 'Results',
        desc: 'Advices with lint recommended from data:',
        content: resultContent,
      },
      {
        title: 'Chart',
        desc: 'Render chart but you also know the limits.',
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
