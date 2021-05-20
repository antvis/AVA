import { Action, VegaLite, Field } from '../../interfaces';
import { RuleID } from '../rules';

export interface ActionExecutorOptions {
  vl: VegaLite;
  action: Action;
  ruleID?: RuleID;
  fields?: Field[];
}
export type ActionExecutor = (params: ActionExecutorOptions) => VegaLite;

export interface Apply {
  token: string;
  type: 'equals' | 'startswith';
  executor: ActionExecutor;
}
