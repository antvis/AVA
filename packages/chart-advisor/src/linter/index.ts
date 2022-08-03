import { DataFrame } from '@antv/data-wizard';

import { processRuleCfg } from '../ruler';

import { getChartType, lintRules } from './utils';

import type { RuleConfig, RuleModule, BasicDataPropertyForAdvice } from '../ruler';
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
   * - options?: linting options
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
    lintRules(this.ruleBase, 'notDESIGN', info, log, lints);

    // DESIGN rules
    lintRules(this.ruleBase, 'DESIGN', info, log, lints, spec);

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
