import { isNominal, isOrdinal, isContinuous } from '@antv/dw-analyzer'
import { RuleModule } from './concepts/rule';
import { IExtendFieldInfo } from '../../../interface';

export const recScaleRule:RuleModule = {
  id: 'pred-scale-type',
  type: 'DESIGN',
  chartTypes: ['graph'],
  docs: {
    detailedText: '',
  },
  optimizer: (fieldInfo: IExtendFieldInfo) => {
    let fieldEncodeType;
    if(!fieldInfo) {
      return 'linear'
    }
    if(isOrdinal(fieldInfo) || isNominal(fieldInfo)) {
      fieldEncodeType = 'ordinal';
    } else if (isContinuous(fieldInfo) || fieldInfo.type === 'integer' || fieldInfo.type === 'float') {
      fieldEncodeType = 'linear';
    }
    return fieldEncodeType
  }
}

export const scaleRules = {
  'pred-scale-type': recScaleRule
}
