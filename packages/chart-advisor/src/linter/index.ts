import { AntVSpec } from '@antv/antv-spec';
import { DataFrame } from '@antv/data-wizard';
import { RuleConfig, processRuleCfg, RuleModule, ChartRuleModule, DesignRuleModule, BasicDataPropertyForAdvice } from '../ruler';
import { DataRows } from '../interface';
import { LinterOptions, Lint } from './interface';
import { getChartType } from './get-charttype';

export class Linter {
  private ruleBase: Record<string, RuleModule>;;

  constructor(ruleCfg?: RuleConfig) {
    this.ruleBase = processRuleCfg(ruleCfg);
  }

  getRuleBase() {
    return this.ruleBase;
  }

  /**
   *
   * @param spec chart spec written in antv-spec
   * @param options linting options
   * @returns error[], the issues violated by the chart spec
   */
  lint(spec: AntVSpec, options?: LinterOptions) {
    // step 0: check spec validation (TODO)
    let ruleScore: Lint[] = [];
    if (spec) {
      const chartType = getChartType(spec);
      if (!chartType) return ruleScore;
      // step 1: get data in spec and build DataFrame
      const dataFrame = new DataFrame(spec.data.values as DataRows);
      const dataProps = dataFrame.info() as BasicDataPropertyForAdvice[];
      const purpose = options && options.purpose ? options.purpose : undefined;
      const preferences = options && options.preferences ? options.preferences : undefined;

      // step 2: lint rules
      // HARD and SOFT rules
      Object.values(this.ruleBase)
      .filter(
        (r: RuleModule) => r.type !== 'DESIGN' && !r.option?.off && r.chartTypes.includes(chartType)
      )
      .forEach((r: RuleModule) => {
        const { type, id, docs } = r;

        // no weight for linter's result
        const score = (r as ChartRuleModule).validator({dataProps, chartType, purpose, preferences});
        ruleScore.push({ type, id, score, docs });
      });

      // DESIGN rules
      Object.values(this.ruleBase)
      .filter(
        (r: RuleModule) => r.type === 'DESIGN' && !r.option?.off && r.chartTypes.includes(chartType)
      )
      .forEach((r: RuleModule) => {
        const { type, id, docs } = r;
        const fix = (r as DesignRuleModule).optimizer(dataProps, spec);
        // no fix -> means no violation
        ruleScore.push({ type, id, score: Object.keys(fix).length === 0 ? 1 : 0, fix, docs });
      });
    }

    // filter rules without score
    ruleScore = ruleScore.filter((record: Record<string, any>) => record.score !== 1 );
    return ruleScore;
  }
}

export * from './interface';
