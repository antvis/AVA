import { DesignRuleModule, RuleModule } from './concepts/rule';
import { scaleRules } from './pred-scale-type'
import { encodingRules } from './pred-encoding'
import { edgeTypeRules } from './pred-edge-type'
import { nodeTypeRules } from './pred-node-type'
import { layoutTypePredRule } from './pred-layout-type'
import { layoutConfigPredRule } from './pred-layout-cfg'

const layoutRules = {
  'pred-layout-type': layoutTypePredRule,
  'pred-layout-config': layoutConfigPredRule
}
export const ruleSet = {
  scaleRules, 
  encodingRules,
  edgeTypeRules,
  nodeTypeRules,
  layoutRules
}

export const allBuiltInRules = {
  ...scaleRules, 
  ...encodingRules,
  ...edgeTypeRules,
  ...nodeTypeRules,
  ...layoutRules
}

/**
 * 根据 soft rule 和 hard rule 来为候选项过滤和排序
 * @param candidates 候选项
 * @param ruleId 规则 Id
 * @returns 经过规则测试后, 符合规则的候选项，如果规则对候选项进行了评分，则按分数从高到低排序
 */
export const testRule = (candidates: any[], ruleId: string): any[] => {
  let validatedCandidates: any[] = [];
  const rule = allBuiltInRules[ruleId]
  if(rule.type === 'HARD') {
    validatedCandidates = candidates.filter(item => rule.validator(item))
  } else if(rule.type === 'SOFT') {
    validatedCandidates = candidates.map(item => {
      return {
        item,
        score: rule.validator(item)
      }
    })
    // 得分高的排在前
    validatedCandidates.sort((a,b) => b.score - a.score)
  }
  return validatedCandidates
}

/**
 * 根据配置项优化策略和传入的数据特征及用户配置，推荐配置项值
 * @param dataProps 
 * @param ruleId 
 * @param userCfg
 */
export const optimizeByRule = (dataProps: any, ruleId: string, userCfg?: any): any | any[] => {
  const rule:DesignRuleModule = allBuiltInRules[ruleId]
  let candidates = rule.optimizer(dataProps, userCfg)
  return candidates
}

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
  if(!ids || !ids.length) {
    return allBuiltInRules
  }

  const chartRules: Record<string, RuleModule> = {};
  ids.forEach((id: string) => {
    if (Object.keys(allBuiltInRules).includes(id)) {
      chartRules[id] = allBuiltInRules[id];
    }
  });

  return chartRules;
};

export * from './concepts/rule';
