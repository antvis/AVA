import { intersects } from '../utils';
import { DEFAULT_RULE_WEIGHTS } from '../constants';
import { CHART_IDS } from '../../ckb';

import type { ScoringResultForRule } from '../types';
import type { CkbTypes } from '../../ckb';
import type { BasicDataPropertyForAdvice, ChartRuleModule, Info, RuleModule } from './types';

export function compare(f1: any, f2: any) {
  if (f1.distinct < f2.distinct) {
    return 1;
  }
  if (f1.distinct > f2.distinct) {
    return -1;
  }

  return 0;
}

export function verifyDataProps(
  dataPre: CkbTypes.ChartKnowledge['dataPres'][number],
  dataProps: BasicDataPropertyForAdvice[]
) {
  const fieldsLOMs: CkbTypes.LevelOfMeasurement[][] = dataProps.map((info: any) => {
    return info.levelOfMeasurements as CkbTypes.LevelOfMeasurement[];
  });
  if (fieldsLOMs) {
    let lomCount = 0;
    fieldsLOMs.forEach((fieldLOM) => {
      if (fieldLOM && intersects(fieldLOM, dataPre.fieldConditions)) {
        lomCount += 1;
      }
    });
    if (lomCount >= dataPre.minQty && (lomCount <= dataPre.maxQty || dataPre.maxQty === '*')) {
      return true;
    }
  }
  return false;
}

export function isUndefined(value: any) {
  return value === undefined;
}

const defaultWeights = DEFAULT_RULE_WEIGHTS;
declare type ChartID = (typeof CHART_IDS)[number];

export const computeScore = (
  chartType: ChartID | string,
  chartWIKI: CkbTypes.ChartKnowledgeBase,
  ruleBase: Record<string, RuleModule>,
  ruleType: 'HARD' | 'SOFT',
  info: Info,
  log: ScoringResultForRule[]
) => {
  // initial score is 1 for HARD rules and 0 for SOFT rules
  let computedScore = 1;
  Object.values(ruleBase)
    .filter((r: RuleModule) => {
      const weight = r.option?.weight || defaultWeights[r.id] || 1;
      const extra = r.option?.extra;
      return r.type === ruleType && r.trigger({ ...info, weight, ...extra, chartType, chartWIKI }) && !r.option?.off;
    })
    .forEach((r: RuleModule) => {
      const weight = r.option?.weight || defaultWeights[r.id] || 1;
      const extra = r.option?.extra;
      const base = (r as ChartRuleModule).validator({ ...info, weight, ...extra, chartType, chartWIKI }) as number;
      const score = weight * base;
      computedScore *= score;
      log.push({ phase: 'ADVISE', ruleId: r.id, score, base, weight, ruleType });
    });
  return computedScore;
};
