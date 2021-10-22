import { RuleModule } from '../../concepts/rule';

const applyChartTypes = ['graph'];
/**
 * TODO: predict the focus node
 * 1. the node of high centrality
 * 2. the node fields with special values e.g. unique node type
 */
export const focusNodeRule: RuleModule = {
  id: 'focus-node-rule',
  type: 'HARD',
  docs: {
    detailedText: '',
  },
  trigger: ({ chartType }) => {
    return applyChartTypes.indexOf(chartType) !== -1;
  },
  validator: ({ field }) => {
    return field.name === 'degree';
  },
};
