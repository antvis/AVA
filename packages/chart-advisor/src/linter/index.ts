import { DataFrame } from '@antv/data-wizard';

import { processRuleCfg } from '../ruler';

import { getChartType } from './get-charttype';

import type { RuleConfig, RuleModule, ChartRuleModule, DesignRuleModule, BasicDataPropertyForAdvice } from '../ruler';
import type { Specification, DataRows, Lint, LintsWithLog } from '../types';
import type { LinterOptions } from './interface';
import type { ScoringResultForRule } from '../advisor';

export interface LintParams {
  spec: Specification;
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
  lint(params: LintParams): Lint[] {
    const lintResult = this.checkRules(params);
    const { lints } = lintResult;
    return lints;
  }

  /**
   * Lint and return with linting log
   *
   * @param params
   */
  lintWithLog(params: LintParams): LintsWithLog {
    const lintResult = this.checkRules(params);
    return lintResult;
  }

  private checkRules(params: LintParams): LintsWithLog {
    const { spec, options } = params;
    let { dataProps } = params;

    const purpose = options?.purpose;
    const preferences = options?.preferences;
    const chartType = getChartType(spec);

    let lints: Lint[] = [];
    // for log
    const log: ScoringResultForRule[] = [];

    if (!spec || !chartType) {
      return { lints, log };
    }

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
        return { lints, log };
      }
    }

    const info = { dataProps, chartType, purpose, preferences };

    // step 2: lint rules
    // HARD and SOFT rules
    Object.values(this.ruleBase)
      .filter((r: RuleModule) => {
        const others = r.option?.customFeatures;
        return r.type !== 'DESIGN' && !r.option?.off && r.trigger({ ...info, others });
      })
      .forEach((r: RuleModule) => {
        const { type, id, docs } = r;

        const others = r.option?.customFeatures;

        // no weight for linter's result
        const score = (r as ChartRuleModule).validator({ ...info, others }) as number;

        log.push({ phase: 'LINT', ruleId: r.id, score, base: score, weight: 1, ruleType: r.type });

        lints.push({ type, id, score, docs });
      });

    // DESIGN rules
    Object.values(this.ruleBase)
      .filter((r: RuleModule) => {
        const others = r.option?.customFeatures;
        return r.type === 'DESIGN' && !r.option?.off && r.trigger({ ...info, others });
      })
      .forEach((r: RuleModule) => {
        const { type, id, docs } = r;
        const fix = (r as DesignRuleModule).optimizer(dataProps, spec);

        // no fix -> means no violation
        const score = Object.keys(fix).length === 0 ? 1 : 0;

        log.push({ phase: 'LINT', ruleId: r.id, score, base: score, weight: 1, ruleType: 'DESIGN' });

        lints.push({ type, id, score, fix, docs });
      });

    // filter rules with problems (score<1)
    lints = lints.filter((record) => record.score !== 1);

    const result: LintsWithLog = {
      lints,
      log,
    };

    return result;
  }
}

export * from './interface';
