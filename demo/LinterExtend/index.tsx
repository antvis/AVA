import * as React from 'react';
import { getFieldsFromData, vl2asp, Linter, fixer, VegaLite, Rule, Field } from '../../packages/chart-linter/src';
import { wrongColumn } from './demos';
import { G2PlotWrapper } from './G2PlotWrapper';
import { SpecWrapper } from './SpecWrapper';
import { LinterWrapper } from './LinterWrapper';
import { libConfigToSpec } from '../../packages/chart-linter/src/adaptor';

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

export class LinterExtendDemo extends React.Component<{}, State> {
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

  async componentDidMount() {
    this.linter = new Linter();

    const demo = wrongColumn;
    const adaptedSpec = libConfigToSpec(demo);
    const aspStr = adaptedSpec && (await this.toVL2ASP(adaptedSpec));
    this.linter.init().then(() => {
      if (aspStr) this.toSolve(aspStr);
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
    return vl2asp(spec, this.state.fieldInfos).join('\n');
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

  render() {
    const { violatedRules } = this.state;
    const demo = wrongColumn;
    const adaptedSpec = libConfigToSpec(demo);

    return (
      <div className="chart-linter-extend-container">
        <div className="column">
          <div className="column">
            <h1>Chart Linter Extend</h1>
            <p>We can apply Chart Linter to more chart libraries and more scenarios.</p>
            <p>
              Try it now! Transform your chart to Vega-Lite by the adaptor, get the lint rules, and then fix them on
              your application.
            </p>
          </div>

          <div className="row">
            <div className="column">
              <h2>G2Plot:</h2>
              <G2PlotWrapper config={demo} />
            </div>
          </div>

          <div className="row">
            <div className="column">
              <h2>Vega-Lite:</h2>
              <SpecWrapper spec={adaptedSpec} />
            </div>
          </div>

          <div className="row">
            <div className="column">
              <h2>Linter:</h2>
              <LinterWrapper violatedRules={violatedRules} />
            </div>
          </div>
        </div>
      </div>
    );
  }
}
