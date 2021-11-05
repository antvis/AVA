import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Steps, Menu, Dropdown, Radio, List } from 'antd';
import { CaretDownOutlined } from '@ant-design/icons';
import { specToG2Plot } from '@antv/antv-spec';
import ReactJson from 'react-json-view';
import { SheetComponent } from '@antv/s2';

import { ChartAdvisor } from '@antv/chart-advisor';

const { Step } = Steps;

const ShowJSON = (json) => (
  <ReactJson src={json} iconStyle name={false} displayObjectSize={false} displayDataTypes={false} collapsed={1} />
);

const ShowTable = (data, { height, width }) => {
  const s2DataConfig = { fields: { columns: Object.keys(data[0]) }, data };
  const s2options = { width, height };

  return <SheetComponent dataCfg={s2DataConfig} options={s2options} sheetType="table" themeCfg={{ name: 'simple' }} />;
};

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
        <div style={{ height: '300px', overflowY: 'scroll', border: '2px solid #eee', padding: '20px' }}>
          {dataRadioValue === 'Table' ? ShowTable(data, { height: 300, width: 300 }) : ShowJSON(data)}
        </div>
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
        <div style={{ height: '300px', overflowY: 'scroll', border: '2px solid #eee', padding: '20px' }}>
          {ShowJSON(results[currentResult])}
        </div>
      </>
    );

    const plotContent = (
      <>
        <LintCard lints={results[currentResult].lint} />
        <Chart id={'vis'} spec={results[currentResult].spec} />
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
