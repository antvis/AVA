import { analyzer } from '@antv/data-wizard';
import { RuleModule, ExtendFieldInfo } from './concepts/rule';

export const recScaleRule: RuleModule = {
  id: 'pred-scale-type',
  type: 'DESIGN',
  chartTypes: ['graph'],
  docs: {
    detailedText: '',
  },
  optimizer: (fieldInfo: ExtendFieldInfo) => {
    let fieldEncodeType;
    if (!fieldInfo) {
      return 'linear';
    }
    if (analyzer.isOrdinal(fieldInfo) || analyzer.isNominal(fieldInfo)) {
      fieldEncodeType = 'ordinal';
    } else if (analyzer.isContinuous(fieldInfo) || fieldInfo.type === 'integer' || fieldInfo.type === 'float') {
      fieldEncodeType = 'linear';
    }
    return fieldEncodeType;
  },
};

export const scaleRules = {
  'pred-scale-type': recScaleRule,
};
