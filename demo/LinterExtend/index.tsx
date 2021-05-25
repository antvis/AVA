import * as React from 'react';
import { getFieldsFromData, vl2asp, Linter, VegaLite, Rule, Field } from '../../packages/chart-linter/src';
import { wrongColumn } from './demos';
import { G2PlotWrapper } from './G2PlotWrapper';
import { SpecWrapper } from './SpecWrapper';
import { LinterWrapper } from './LinterWrapper';
import { libConfigToSpec } from '../../packages/chart-linter/src';
import styles from './index.module.less';

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

  render() {
    const { violatedRules } = this.state;
    const demo = wrongColumn;
    const adaptedSpec = libConfigToSpec(demo);
    return (
      <div className={styles.chartLinterExtendContainer}>
        <div className={styles.column}>
          <div className={styles.column}>
            <h1>Chart Linter Extend</h1>
            <p>We can apply Chart Linter to more chart libraries and more scenarios.</p>
            <p>
              Try it now! Transform your chart to Vega-Lite by the adaptor, get the lint rules, and then fix them on
              your application.
            </p>
          </div>

          <div className={styles.row}>
            <div className={styles.column}>
              <h2>G2Plot:</h2>
              <G2PlotWrapper config={demo} />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.column}>
              <h2>Vega-Lite:</h2>
              <SpecWrapper spec={adaptedSpec} />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.column}>
              <h2>Linter:</h2>
              <LinterWrapper violatedRules={violatedRules} />
            </div>
          </div>
        </div>
      </div>
    );
  }
}
