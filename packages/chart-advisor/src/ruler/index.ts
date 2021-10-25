import { RuleModule, RuleConfig } from './concepts/rule';
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

/**
 * processing ckb config and setup ckb used for advising
 * @param ruleCfg rule configuration
 * @returns rule base Record<string, RuleModule>
 */
export const processRuleCfg = (ruleCfg?: RuleConfig) => {
  if (!ruleCfg) {
    // no specific rule configuration -> return default rules
    return getChartRules(builtInRules);
  }

  // step 1: remove excluded rule
  const ruleBase = getChartRules(builtInRules);
  if (ruleCfg.exclude) {
    // have `exclude` definition
    const toExclude = ruleCfg.exclude;
    toExclude.forEach((id: string) => {
      if (Object.keys(ruleBase).includes(id)) {
        delete ruleBase[id];
      }
    });
  }

  // step 2: remove rules that are not included
  if (ruleCfg.include) {
    const toInclude = ruleCfg.include;
    Object.keys(ruleBase).forEach((id: string) => {
      if (!toInclude.includes(id)) {
        delete ruleBase[id];
      }
    });
  }

  // step 3: combine ruleBase and custom rules
  const finalRuleBase = {
    ...ruleBase,
    ...ruleCfg.custom,
  };

  // step 4: check options
  const { options } = ruleCfg;
  if (options) {
    const ruleWithOption = Object.keys(options);
    ruleWithOption.forEach((rule: string) => {
      if (Object.keys(finalRuleBase).includes(rule)) {
        const ruleOption = options[rule];
        finalRuleBase[rule] = {
          ...finalRuleBase[rule],
          option: ruleOption,
        };
      }
    });
  }

  return finalRuleBase;
};

export * from './concepts/rule';
