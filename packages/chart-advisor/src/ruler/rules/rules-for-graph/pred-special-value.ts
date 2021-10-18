import { RuleModule } from './concepts/rule';
import { IExtendFieldInfo } from '../../../interface';

/** 
 * TODO 中心点预测规则
 * 1. 度数高且唯一
 * 2. 字段中有特殊值 e.g. 比如唯一的类型
*/
export const focusNodeRule:RuleModule = {
  id: 'focus-node-rule',
  type: 'DESIGN',
  docs: {
    detailedText: '',
  },
  optimizer: (field: IExtendFieldInfo) => {
    return field.fieldName === 'degree'
  }
}
