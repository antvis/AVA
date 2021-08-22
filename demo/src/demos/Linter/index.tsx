import * as React from 'react';
import { cloneDeep } from 'lodash';
import { Button, Menu, Dropdown } from 'antd';
import { BarChartOutlined } from '@ant-design/icons';
import { getFieldsFromData, vl2asp, Linter, fixer, VegaLite, Rule, Field } from '../../packages/chart-linter/src';
import { EXAMPLES, fillUrlDataFakeSpec } from './constants';
import { ChartCodeWrapper } from './ChartCodeWrapper';
import { ASPLinterWrapper } from './ASPLinterWrapper';

import './index.less';

interface State {
  exampleIndex: number;
  aspStr: string;
  violatedRules: Rule[][];
  solverInit: boolean;
  optVL: any;
  fixing: boolean;
  fieldInfos: Field[];
}

export class LinterDemo extends React.Component<{}, State> {
  private linter: any;

  constructor(props: {}) {
    super(props);

    this.state = {
      exampleIndex: 0,
      aspStr: '',
      violatedRules: [],
      solverInit: false,
      optVL: {},
      fixing: false,
      fieldInfos: [],
    };
  }

  reset() {
    this.setState({
      aspStr: '',
      violatedRules: [],
      optVL: {},
      fixing: false,
      fieldInfos: [],
    });
  }

  componentDidMount() {
    this.linter = new Linter();

    this.linter.init().then(() => {
      this.setState({ solverInit: true });
    });
  }

  async toGetFieldsFromData(spec: VegaLite) {
    const fieldInfos = await getFieldsFromData(spec);
    this.setState({
      fieldInfos: fieldInfos,
    });
  }

  async toVL2ASP(spec: VegaLite) {
    await this.toGetFieldsFromData(spec);
    this.setState({
      aspStr: vl2asp(spec, this.state.fieldInfos).join('\n'),
    });
  }

  toSolve(program: string) {
    const { rules } = this.linter.solve(program, { models: 5 });
    this.setState({
      violatedRules: rules,
    });
  }

  async toFix(vl: VegaLite, rules: Rule[]) {
    this.setState({
      fixing: true,
    });
    const { optimizedVL } = await fixer(vl, rules, this.state.fieldInfos);
    this.setState({
      optVL: optimizedVL,
      fixing: false,
    });
  }

  menu = (
    <Menu
      onClick={({ key }) => {
        this.reset();
        this.setState({
          exampleIndex: key as number,
        });
      }}
    >
      {EXAMPLES.map((example, index) => (
        <Menu.Item key={index} icon={<BarChartOutlined />}>
          {example.name}
        </Menu.Item>
      ))}
    </Menu>
  );

  render() {
    const { aspStr, violatedRules, solverInit, exampleIndex, optVL, fixing } = this.state;
    const pickViolatedRuleArray = violatedRules[0]; // TODO
    const example = EXAMPLES[exampleIndex];
    const originVLInUrl = fillUrlDataFakeSpec(example.nodataspec, example.datasetName);

    const optVLNoData = cloneDeep(optVL);
    delete optVLNoData.data;

    return (
      <div className="column">
        <div>
          <h1>Linter</h1>
          <p>Demo for linter usage in react.</p>
        </div>

        <div className="row">
          <h1>OK! Suppose we have a {`'not-so-good'`} chart like this:</h1>
          <Dropdown.Button overlay={this.menu}>{example.name}</Dropdown.Button>
        </div>

        <ChartCodeWrapper nodataspec={example.nodataspec} datasetName={example.datasetName} />

        <div className="step">
          <h1>This chart is not good, but WHY?</h1>
          <p>{`Let's lint it!`}</p>
          <p>1. Translate the Vega-Lite code to ASP.</p>
          <p>2. Find violated rules by Linter.</p>
        </div>

        <ASPLinterWrapper
          solverInit={solverInit}
          toVL2ASP={() => {
            this.toVL2ASP(originVLInUrl);
          }}
          vl={originVLInUrl}
          aspStr={aspStr}
          toSolve={() => {
            this.toSolve(aspStr);
          }}
          violatedRules={violatedRules}
        />

        <div className="row step">
          <h1>To fix these problems, we could:</h1>
          <Button
            type="primary"
            disabled={!violatedRules || !violatedRules.length}
            onClick={async () => {
              await this.toFix(originVLInUrl, pickViolatedRuleArray);
            }}
          >
            Fix
          </Button>
          <p>{violatedRules && violatedRules.length && optVL.mark ? 'Done.' : fixing ? 'Fixing...' : ''}</p>
        </div>

        <ChartCodeWrapper nodataspec={optVLNoData} datasetName={example.datasetName} />
      </div>
    );
  }
}
