import { Solve } from 'javascript-lp-solver';
import { Action, Rule } from '../interfaces';

export interface OptimizedActions {
  updateActions: Action[][];
  optimizeActions: Action[];
}

/**
# How the Solver Works

Since there is not any js LP library that as powerful as pulp, we use the following one to solve:
https://www.npmjs.com/package/javascript-lp-solver

This is like a 'resource consumption model'. 
`constraints` defines the limitation of resources, 
`variables` defines the target objects, including how they consume each resource and what benefit they create.
The result gives a plan to optimize the `optimize` benefit in the `opType`(min or max) way.

Assume we have the input:

  'r-1': ['a-1', 'a-3'],
  'r-2': ['a-2', 'a-3'],

and actions have scores:

  a-1 = 55
  a-2 = 10
  a-3 = 30

We would have:

  rules   |   a-1   a-2   a-3
-------------------------------
  r-1     |   r1a1   -    r1a3
  r-2     |    -    r2a2  r2a3

So we can define the model like this:

  const model = {
    name: 'fixer',
    optimize: 'score',
    opType: 'max',
    constraints: {
      // One rule has only 1 action, consume at variables
      'oneActionPerRule#r-1': { equal: 1 },
      'oneActionPerRule#r-2': { equal: 1 },
    },
    variables: {
      // Since a-1 only works for r-1, if it is applied, 'oneActionPerRule#r-1' will be consumed.
      // If a-1 is applied, only r-1 will be influenced, so the score accumulate once.
      'a-1': { score: 55 * 1, 'oneActionPerRule#r-1': 1, 'oneActionPerRule#r-2': 0 },
      'a-2': { score: 10 * 1, 'oneActionPerRule#r-1': 0, 'oneActionPerRule#r-2': 1 },
      // Since a-3 works for r-1 and r-2, if it is applied, both 'oneAction..' will be consumed.
      // If a-3 is applied, two rules r-1 and r-2 will be influenced, so the score accumulate x 2.
      'a-3': { score: 30 * 2, 'oneActionPerRule#r-1': 1, 'oneActionPerRule#r-2': 1 },
    },
    binaries: {
      // Action variables must be 'not applied'(0) or 'applied'(1), so set they as binaries.
      'a-1': 1,
      'a-2': 1,
      'a-3': 1,
    },
  };

The result of solving this model is:
  {
    feasible: true,
    result: 65,
    bounded: true,
    isIntegral: true,
    'a-1': 1,
    'a-2': 1
  }

If we change the scores of actions to:

  a-1 = 20
  a-2 = 25
  a-3 = 30

The results would be 'a-3' for twice:

  {
    feasible: true,
    result: 60,
    bounded: true,
    isIntegral: true,
    'a-3': 1
  }

What a hack!
*/

export function optimize(actionMatrix: Action[][]): OptimizedActions {
  if (!actionMatrix) return { updateActions: [], optimizeActions: [] };

  // 'r-1': ['a-1', 'a-3'],
  // 'r-2': ['a-2', 'a-3'],

  // a-1: [r-1]
  // a-2: [r-2]
  // a-3: [r-1, r-2]

  const actionRuleRelations: Record<string, { score: number; rules: number[] }> = {};

  actionMatrix.forEach((actionGroupForViolatedRule, ruleIndex) => {
    // rule r-i
    actionGroupForViolatedRule.forEach((action) => {
      // r-i: [a_j]
      const actionKey = genActionKey(action);

      if (!(actionKey in actionRuleRelations)) {
        actionRuleRelations[actionKey] = { score: action.score || 0, rules: [] };
      }

      if (!actionRuleRelations[actionKey].rules.includes(ruleIndex + 1)) {
        actionRuleRelations[actionKey].rules.push(ruleIndex + 1);
      }
    });
  });

  const lpConstraints: any = {};
  const lpVariables: any = {};
  const lpBinaries: any = {};

  actionMatrix.forEach((_, ruleIndex) => {
    lpConstraints[`oneActionPerRule#r-${ruleIndex + 1}`] = { equal: 1 };
  });

  const rulesCount = actionMatrix.length;

  Object.keys(actionRuleRelations).forEach((actionKey) => {
    const { score, rules } = actionRuleRelations[actionKey];
    lpVariables[actionKey] = {
      score: score * rules.length,
    };
    for (let i = 1; i < rulesCount + 1; i++) {
      lpVariables[actionKey][`oneActionPerRule#r-${i}`] = rules.includes(i) ? 1 : 0;
    }

    lpBinaries[actionKey] = 1;
  });

  const model = {
    name: 'fixer',
    optimize: 'score',
    opType: 'max',
    constraints: lpConstraints,
    variables: lpVariables,
    binaries: lpBinaries,
  };

  const results = new Solve(model);

  if (!results.feasible) return { updateActions: [], optimizeActions: [] };

  const applyActions: Action[] = [];

  actionMatrix.forEach((actionGroupForViolatedRule) => {
    actionGroupForViolatedRule.forEach((action) => {
      const apply = genActionKey(action) in results && results[genActionKey(action)] === 1 ? 1 : 0;
      action.apply = apply;
      if (apply) {
        applyActions.push(action);
      }
    });
  });

  return { updateActions: actionMatrix, optimizeActions: applyActions };
}

export function genActionKey(action: Action) {
  const { name, param1, param2 } = action;
  return `${name}_${param1}_${param2}`;
}

export function genRuleKey(rule: Rule) {
  const { id, param1, param2 } = rule;
  return `${id}_${param1}_${param2}`;
}
