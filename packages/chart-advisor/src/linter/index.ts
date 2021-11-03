import { AntVSpec } from '@antv/antv-spec';
import { DataFrame } from '@antv/data-wizard';
import {
  RuleConfig,
  processRuleCfg,
  RuleModule,
  ChartRuleModule,
  DesignRuleModule,
  BasicDataPropertyForAdvice,
} from '../ruler';
import { DataRows } from '../interface';
import { LinterOptions, Lint } from './interface';
import { getChartType } from './get-charttype';

export interface LintParams {
  spec: AntVSpec;
  dataProps?: BasicDataPropertyForAdvice[];
  options?: LinterOptions;
}

export class Linter {
  ruleBase: Record<string, RuleModule>;

  constructor(ruleCfg?: RuleConfig) {
    this.ruleBase = processRuleCfg(ruleCfg);
  }

  /**
   * @param params for lint, including
   *
   * - spec: chart spec written in antv-spec
   * - dataProps?: data props if customized
   * - ontions?: linting options
   * @returns error[], the issues violated by the chart spec
   */
  lint(params: LintParams) {
    const { spec, options } = params;
    let { dataProps } = params;
    let ruleScore: Lint[] = [];
    if (spec) {
      const chartType = getChartType(spec);
      if (!chartType) return ruleScore;
      // step 1: get data in spec and build DataFrame

      if (!dataProps || !dataProps.length) {
        let dataFrame: DataFrame;
        try {
          dataFrame = new DataFrame(spec.data.values as DataRows);
          dataProps = dataFrame.info() as BasicDataPropertyForAdvice[];
        } catch (error) {
          // if the input data cannot be transformed into DataFrame
          // eslint-disable-next-line no-console
          console.error('error: ', error);
          return ruleScore;
        }
      }
      const purpose = options && options.purpose ? options.purpose : undefined;
      const preferences = options && options.preferences ? options.preferences : undefined;
      const info = { dataProps, chartType, purpose, preferences };

      // step 2: lint rules
      // HARD and SOFT rules
      Object.values(this.ruleBase)
        .filter((r: RuleModule) => r.type !== 'DESIGN' && !r.option?.off && r.trigger(info))
        .forEach((r: RuleModule) => {
          const { type, id, docs } = r;

          // no weight for linter's result
          const score = (r as ChartRuleModule).validator(info) as number;
          ruleScore.push({ type, id, score, docs });
        });

      // DESIGN rules
      Object.values(this.ruleBase)
        .filter((r: RuleModule) => r.type === 'DESIGN' && !r.option?.off && r.trigger(info))
        .forEach((r: RuleModule) => {
          const { type, id, docs } = r;
          const fix = (r as DesignRuleModule).optimizer(dataProps, spec);
          // no fix -> means no violation
          ruleScore.push({ type, id, score: Object.keys(fix).length === 0 ? 1 : 0, fix, docs });
        });
    }

    // filter rules without score
    ruleScore = ruleScore.filter((record: Record<string, any>) => record.score !== 1);
    return ruleScore;
  }
}

export * from './interface';
