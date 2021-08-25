import { RuleModule } from './concepts/rule';
import { rules } from './rules';

export const builtInRules = Object.keys(rules);

/**
 *
 * @param id rule id
 * @returns the rule object or null if `id` not exist in built-in rules
 */
export const getChartRule = (id: string): RuleModule | null => {
  if (Object.keys(rules).includes(id)) {
    return rules[id];
  }
  return null;
};

/**
 *
 * @param ids rule list
 * @returns rule object list
 */
export const getChartRules = (ids: string[]): Record<string, RuleModule> => {
  const chartRules: Record<string, RuleModule> = {};
  ids.forEach((id: string) => {
    if (Object.keys(rules).includes(id)) {
      chartRules[id] = rules[id];
    }
  });

  return chartRules;
};

export * from './concepts/rule';
