import { BasicDataPropertyForAdvice, RuleModule } from '../../concepts/rule';
import { scaleRules } from './pred-scale-type';
import { encodingRules } from './pred-encoding';
import { edgeTypeRules } from './pred-edge-type';
import { nodeTypeRules } from './pred-node-type';
import { allLayoutTypeRules } from './pred-layout-type';
import { layoutConfigPredRule } from './pred-layout-cfg';

const layoutRules = {
  ...allLayoutTypeRules,
  'pred-layout-config': layoutConfigPredRule,
};
export const ruleSet = {
  scaleRules,
  encodingRules,
  edgeTypeRules,
  nodeTypeRules,
  layoutRules,
};

export const allBuiltInRules = {
  ...scaleRules,
  ...encodingRules,
  ...edgeTypeRules,
  ...nodeTypeRules,
  ...layoutRules,
};

/**
 * Check, filter and sort all candidate fields according to a soft rule or a hard rule
 * @param candidates
 * @param ruleId
 * @returns Testing the rule, and return the candidates that match the rule. If the rule scores the candidates, they are sorted from highest to lowest score.
 */
export const testRule = (candidates: BasicDataPropertyForAdvice[], ruleId: string): BasicDataPropertyForAdvice[] => {
  let validatedCandidates: any[] = [];
  const rule = allBuiltInRules[ruleId];
  if (rule.type === 'HARD') {
    validatedCandidates = candidates.filter((item) => rule.validator({ field: item }));
  } else if (rule.type === 'SOFT') {
    validatedCandidates = candidates.map((item) => {
      return {
        item,
        score: rule.validator({ field: item }),
      };
    });
    validatedCandidates.sort((a, b) => b.score - a.score);
  }
  return validatedCandidates;
};

/**
 *
 * @param id rule id
 * @returns the rule object or null if `id` not exist in built-in rules
 */
export const getRuleById = (id: string): RuleModule | null => {
  if (Object.keys(allBuiltInRules).includes(id)) {
    return allBuiltInRules[id];
  }
  return null;
};

/**
 *
 * @param ids rule list
 * @returns rule object record
 */
export const getRules = (ids?: string[]): Record<string, RuleModule> => {
  if (!ids || !ids.length) {
    return allBuiltInRules;
  }

  const chartRules: Record<string, RuleModule> = {};
  ids.forEach((id: string) => {
    if (Object.keys(allBuiltInRules).includes(id)) {
      chartRules[id] = allBuiltInRules[id];
    }
  });

  return chartRules;
};
