import { RuleModule, ExtendFieldInfo } from './concepts/rule';

/** 
 * TODO: predict the focus node
 * 1. the node of high centrality
 * 2. the node fields with special values e.g. unique node type
*/
export const focusNodeRule:RuleModule = {
  id: 'focus-node-rule',
  type: 'DESIGN',
  docs: {
    detailedText: '',
  },
  optimizer: (field: ExtendFieldInfo) => {
    return field.fieldName === 'degree'
  }
}
