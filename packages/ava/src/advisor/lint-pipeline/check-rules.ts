import { DataFrame } from '../../data';

import { getChartType } from './getChartType';
import { lintRules } from './lintRules';

import type { CkbTypes } from '../../ckb';
import type { LintResult, ScoringResultForRule, LintParams, Lint } from '../types';
import type { BasicDataPropertyForAdvice, RuleModule } from '../ruler';
import type { Datum } from '../../common/types';

export function checkRules(
  params: LintParams,
  ruleBase: Record<string, RuleModule>,
  ckb: CkbTypes.ChartKnowledgeBase
): LintResult {
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
      dataFrame = new DataFrame(spec.data as Datum);
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
  lintRules(ruleBase, 'notDESIGN', info, log, lints, ckb);

  // DESIGN rules
  lintRules(ruleBase, 'DESIGN', info, log, lints, ckb, spec);

  // filter rules with problems (score<1)
  lints = lints.filter((record) => record.score !== 1);

  const result: LintResult = {
    lints,
    log,
  };

  return result;
}
