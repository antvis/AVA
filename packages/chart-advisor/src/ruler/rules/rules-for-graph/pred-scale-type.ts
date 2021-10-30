import { analyzer } from '@antv/data-wizard';
import { BasicDataPropertyForAdvice, RuleModule } from '../../concepts/rule';

const applyChartTypes = ['graph'];
export const recScaleRule: RuleModule = {
  id: 'pred-scale-type',
  type: 'DESIGN',
  docs: {
    detailedText: '',
  },
  trigger: ({ chartType }) => {
    return applyChartTypes.indexOf(chartType) !== -1;
  },
  optimizer: (fieldInfo: BasicDataPropertyForAdvice) => {
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
