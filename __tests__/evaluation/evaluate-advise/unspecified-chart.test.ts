import { runAdviseEvaluation } from './shared';
import { TestData } from './shared';
import { validateObject } from '../../../src/utils/validator';
import { CHARTS } from '../../../src/ckb';
import { Spec } from '../../../src/types';

// 未指定图表类型的评测，评测 advise 方法
runAdviseEvaluation(
  (d: TestData) => d.questionWithoutChart,
  (spec: Spec, answer: TestData['answer']) => {
    const { type, ...finalSpec } = spec || {};
    // 未指定图表类型时，以下图表类型认为是等价的
    const equivalentSets = [
      new Set(['line', 'area', 'column', 'bar']),
      new Set(['bar', 'column', 'pie']),
      new Set(['violin', 'boxplot']),
      new Set(['word-cloud', 'bar', 'column']),
      new Set(['indented-tree', 'organization-chart']),
      new Set(['radar', 'bar', 'column']),
    ];
    const typeMatches = (a?: string, b?: string) => {
      if (!a || !b) return false;
      if (a === b) return true;
      return equivalentSets.some((set) => set.has(a) && set.has(b));
    };
    return typeMatches(type, answer.type) && validateObject(CHARTS[type].zodSchema, finalSpec) === true;
  }
);
