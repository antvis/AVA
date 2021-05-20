import { Action, VegaLite, Field } from '../../interfaces';
import { RuleID } from '../rules';
import { ACTION_ROUTER } from './router';
import { ActionExecutorOptions } from './interfaces';

/**
 * Apply action and return new vegalite json
 *
 * @param vl the origin vegalite json
 * @param ruleID the rule id considering this action
 * @param action the current action
 * @param fields all fields in data
 */
export function applyActions(vl: VegaLite, ruleID: RuleID, action: Action, fields: Field[]): VegaLite {
  const { name: actionName, originAction } = action;

  if (originAction === 'CHANGE_MARK') {
    return ACTION_ROUTER['CHANGE_MARK'].executor({ vl, action });
  } else if (originAction === 'CHANGE_CHANNEL') {
    return ACTION_ROUTER['CHANGE_CHANNEL'].executor({ vl, action });
  }

  return exec(actionName, { vl, action, ruleID, fields }) || vl;

  // else:
  //     # TODO default case
  //     # what to do?
  //     newvl = copy.deepcopy(vl)
}

function exec(actionName: string, options: ActionExecutorOptions): VegaLite | undefined {
  const key = Object.keys(ACTION_ROUTER).find((key) => {
    const { token, type } = ACTION_ROUTER[key];

    if (type === 'equals') return actionName === token;
    if (type === 'startswith') return actionName.startsWith(token);
    return false;
  });

  if (!key) return undefined;

  return ACTION_ROUTER[key].executor(options);
}
