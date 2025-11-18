import { runAdviseEvaluation } from './shared';
import { TestData } from './shared';
import { validateObject } from '../../../src/utils/validator';
import { CHARTS } from '../../../src/ckb';
import { Spec } from '../../../src/types';

// 指定图表类型，评测 advise 方法
runAdviseEvaluation(
  (d: TestData) => d.question,
  (spec: Spec, answer: TestData['answer']) => {
    const { type, ...finalSpec } = spec || {};
    return type === answer.type && validateObject(CHARTS[type].zodSchema, finalSpec) === true;
  }
);
