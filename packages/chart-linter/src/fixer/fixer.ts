import { cloneDeep } from 'lodash';
import { vl2asp } from '../translator';
import { Linter } from '../linter';
import {
  Rule,
  Field,
  Action,
  VegaLite,
  isAvailableMark,
  AVAILABLE_MARKS,
  isAvailableChannel,
  AVAILABLE_CHANNELS,
} from '../interfaces';
import { RULES, isRuleID, RuleID } from './rules';
import { TRANSITION_COST } from './costs';
import { applyActions } from './actions';
import { optimize, genActionKey, genRuleKey } from './optimize';

interface Fix {
  fixable: boolean;
  optimizedVL: VegaLite | {};
  optimizedActions: any[];
  possibleActions: any[];
  // allActions: Action[];
  // rules: Rule[];
  originalVL: VegaLite;
}

interface FixerOptions {
  weight1: number;
  weight2: number;
}

/**
 * Get optimal actions to fix rules of the visualization
 *
 * @param vl vega-lite JSON
 * @param spec the translated vis spec
 * @param rules the violated rules found in the linter
 * @param fields field information of data
 */
export async function fixer(
  vl: VegaLite,
  rules: Rule[],
  fields: Field[],
  options: FixerOptions = { weight1: 0.7, weight2: 0.3 }
): Promise<Fix> {
  const { weight1, weight2 } = options;
  const maxCost = Math.max(...Object.values(TRANSITION_COST));

  // 1. get all possible actions

  const detailActionSets: Action[][] = [];
  rules.forEach((rule) => {
    detailActionSets.push(getActions(vl, rule));
  });

  // 2. get all possible actions score, consists of:
  //    1. reward = 动作减少的违背 - alpha * 动作增加的违背
  //    2. cost = 动作的transition cost from Graphscape

  for (let i = 0; i < detailActionSets.length; i++) {
    const actions = detailActionSets[i];

    for (let j = 0; j < actions.length; j++) {
      // todo 测试所有 action 的 transition cost 正常计算得到

      const action = actions[j];

      const transitionCost = getTransitionCost(action);
      action.transition = transitionCost ? transitionCost / maxCost : 1;

      const actionReward = await getActionReward(vl, rules, action.ruleID, action, fields);
      action.reward = actionReward || 0;

      action.score = weight1 * action.reward - weight2 * action.transition;
    }
  }

  // 3. use linear programming to find optimal set of actions
  // add action attribute 'apply'

  const { updateActions, optimizeActions } = optimize(detailActionSets);

  const actionKeys: string[] = [];
  let newVL = cloneDeep(vl);
  // remove duplicate actions
  optimizeActions.forEach((action) => {
    if (!actionKeys.includes(genActionKey(action))) {
      newVL = applyActions(newVL, action.ruleID, action, fields);
      actionKeys.push(genActionKey(action));
    }
  });

  const fixable = optimizeActions && optimizeActions.length > 0;

  const res: Fix = {
    fixable,
    optimizedVL: fixable ? newVL : {},
    optimizedActions: actionKeys,
    possibleActions: updateActions,
    originalVL: vl,
  };

  return res;
}

export function getActions(vl: VegaLite, rule: Rule): Action[] {
  const { id, param1, param2 } = rule;

  if (!isRuleID(id)) return [];

  const generalActions = RULES[id].actions;

  const actions: Action[] = [];

  generalActions.forEach((action) => {
    if (action.includes('CHANGE_MARK')) {
      actions.push(...getChangeMarkActions(vl, id));
    } else if (action.includes('CHANGE_CHANNEL')) {
      actions.push(...getChangeChannelActions(vl, id, param1));
    } else {
      if (action.includes('(')) {
        const presetParam = action.split("'")[1].toLowerCase();
        actions.push({
          name: action.split('(')[0],
          param1: presetParam,
          param2: '',
          ruleID: id,
        });
      } else {
        actions.push({
          name: action,
          param1,
          param2,
          ruleID: id,
        });
      }
    }
  });

  return actions;
}

export function getChangeMarkActions(vl: VegaLite, id: RuleID): Action[] {
  // TODO 默认一定有 mark 吗？

  const { mark: prevMark } = vl;

  if (!prevMark || !isAvailableMark(prevMark as string)) return [];

  const actions: Action[] = AVAILABLE_MARKS.filter((mark) => mark !== prevMark).map((nextMark) => {
    return {
      name: `${prevMark}_${nextMark}`.toUpperCase(),
      param1: '',
      param2: '',
      ruleID: id,
      originAction: 'CHANGE_MARK',
    };
  });

  return actions;
}

export function getChangeChannelActions(vl: VegaLite, id: RuleID, channel: string): Action[] {
  const usedChannels = Object.keys(vl.encoding || {}).filter((key) => isAvailableChannel(key));
  const usedChannelsInUpperCase = usedChannels.map((channel) => channel.toUpperCase());

  const actions: Action[] = AVAILABLE_CHANNELS.filter(
    (channel) => !usedChannelsInUpperCase.includes(channel.toUpperCase())
  ).map((newChannel) => {
    return {
      name: `MOVE_${channel}_${newChannel}`.toUpperCase(),
      param1: '',
      param2: '',
      ruleID: id,
      originAction: 'CHANGE_CHANNEL',
    };
  });

  return actions;
}

export function getTransitionCost(action: Action): number {
  const { name: actionName, param1 } = action;
  if (
    !(actionName.includes('MOVE_') && !actionName.includes('REMOVE_')) &&
    !(actionName.includes('CHANGE_TYPE') || actionName.includes('CORRECT')) &&
    !(actionName.includes('LOG') || actionName.includes('BIN') || actionName.includes('ZERO')) &&
    param1
  ) {
    return TRANSITION_COST[`${actionName}_${param1}`.toUpperCase()];
  }

  return TRANSITION_COST[actionName];
}

/**
 * Compute the reward of a given action.
 *
 * @param vl the origin vegalite json
 * @param currRules the rule set that vl violates
 * @param ruleID the rule id considering this action
 * @param action the current action
 * @param fields all fields in data
 */
export async function getActionReward(
  vl: VegaLite,
  currRules: Rule[],
  ruleID: RuleID,
  action: Action,
  fields: Field[]
): Promise<number> {
  let reward;

  // 1. get new vl after performing action
  const newVL = applyActions(vl, ruleID, action, fields);

  // 2. get new rules of new vl from linter

  // TODO:
  // const newSpec = vl2asp(newVL, fields);
  const newSpec = vl2asp(newVL, fields);

  const linter = new Linter();

  let newRules: Rule[] = [];
  await linter.init().then(() => {
    const result = linter.solve(newSpec.join('\n'), { models: 5 });
    const ruleSet = result?.rules;
    if (ruleSet && ruleSet.length) {
      // TODO: [0]?
      newRules = ruleSet[0];
    }
  });

  // 3. compare two rule set
  // |c_i - c_i+1| / |c_i| - alpha * |c_i+1 - c_i| / |c_i+1|
  //
  // i means last round, aka currRules
  // i+1 means new round, aka newRules

  const ALPHA = 0.05;

  let desSize = 0; // violated rules --
  let incSize = 0; // violated rules ++

  const currRulesKeys = currRules.map((rule) => genRuleKey(rule));
  const newRulesKeys = newRules.map((rule) => genRuleKey(rule));

  // rule in curr(i) but not in new(i+1), good, reward
  currRulesKeys.forEach((curr) => {
    if (!newRulesKeys.includes(curr)) {
      desSize += 1;
    }
  });

  // rule in new(i+1) but not in curr(i), new violated rule, bad, punish
  newRulesKeys.forEach((newr) => {
    if (!currRulesKeys.includes(newr)) {
      incSize += 1;
    }
  });

  if (newRules.length) {
    reward = desSize / currRules.length - (ALPHA * incSize) / newRules.length;
  } else {
    reward = desSize / currRules.length;
  }

  return reward;
}
