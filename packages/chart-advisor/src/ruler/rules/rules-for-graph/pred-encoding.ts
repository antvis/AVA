import { isNominal, isOrdinal } from '@antv/dw-analyzer'
import { RuleModule } from './concepts/rule';
import { IExtendFieldInfo } from '../../../interface';
import { MAX_DISTINCT_COLOR } from './const'

// TODO AVA 2.0 中能直接从 fieldInfo.levelOfMeasurements 中拿到 ordinal 等类型的字段数组
// TODO 变成 SOFT 规则， 打分制  现在判断比较严格，也没有区分对待nominal和ordinal 采用打分制更好
export const fieldForColorRule: RuleModule = {
  id: 'field-for-node-color',
  type: 'HARD',
  docs: {
    detailedText: `A field can encode to color if is nominal or ordinal, and the number of its distinct values is less than ${MAX_DISTINCT_COLOR}`,
  },
  validator: (field: IExtendFieldInfo) => {
    return (isNominal(field) || isOrdinal(field)) && field.missing === 0 && field.distinct > 1 && field.distinct <= MAX_DISTINCT_COLOR 
  }
}

// TODO 暂时使用 degree 来编码节点大小，需要改为 SOFT 规则，根据字段的连续型、显著性、有效性等来计分
export const fieldForSizeRule: RuleModule = {
  id: 'field-for-size',
  type: 'HARD',
  docs: {
    detailedText: '',
  },
  validator: (field: IExtendFieldInfo) => {
    return field.fieldName === 'degree'
  }
}

// TODO 暂时和颜色字段规则一致
export const fieldForCluster: RuleModule = {
  id: 'field-for-cluster',
  type: 'HARD',
  docs: {
    detailedText: '',
  },
  validator: fieldForColorRule.validator
}

// TODO 暂时和颜色字段规则一致
export const fieldForLabel: RuleModule = {
  id: 'field-for-abel',
  type: 'HARD',
  docs: {
    detailedText: '',
  },
  validator: fieldForColorRule.validator
}

export const encodingRules = {
  'field-for-color': fieldForColorRule,
  'field-for-size': fieldForSizeRule,
  'field-for-cluster': fieldForCluster,
  'field-for-label': fieldForLabel
}
