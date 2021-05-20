import { optimize } from '../../../src/fixer/optimize';
import { Action } from '../../../src/interfaces';

describe('UNIT TEST - chart-linter/fixer/optimize', () => {
  test('should work', () => {
    const input: Action[][] = [
      [
        // violated rule1: aggregate_o_valid
        { name: 'a-1', param1: 'p1', param2: 'p11', ruleID: 'aggregate_o_valid', score: 20 },
        { name: 'a-3', param1: 'p3', param2: 'p33', ruleID: 'aggregate_o_valid', score: 30 },
      ],
      [
        // violated rule2: bin_q_o
        { name: 'a-2', param1: 'p2', param2: 'p22', ruleID: 'bin_q_o', score: 25 },
        { name: 'a-3', param1: 'p3', param2: 'p33', ruleID: 'bin_q_o', score: 30 },
      ],
    ];
    const { updateActions, optimizeActions } = optimize(input);

    expect(updateActions).toEqual([
      [
        {
          name: 'a-1',
          param1: 'p1',
          param2: 'p11',
          ruleID: 'aggregate_o_valid',
          score: 20,
          apply: 0,
        },
        {
          name: 'a-3',
          param1: 'p3',
          param2: 'p33',
          ruleID: 'aggregate_o_valid',
          score: 30,
          apply: 1,
        },
      ],
      [
        {
          name: 'a-2',
          param1: 'p2',
          param2: 'p22',
          ruleID: 'bin_q_o',
          score: 25,
          apply: 0,
        },
        {
          name: 'a-3',
          param1: 'p3',
          param2: 'p33',
          ruleID: 'bin_q_o',
          score: 30,
          apply: 1,
        },
      ],
    ]);

    expect(optimizeActions).toEqual([
      {
        name: 'a-3',
        param1: 'p3',
        param2: 'p33',
        ruleID: 'aggregate_o_valid',
        score: 30,
        apply: 1,
      },
      {
        name: 'a-3',
        param1: 'p3',
        param2: 'p33',
        ruleID: 'bin_q_o',
        score: 30,
        apply: 1,
      },
    ]);
  });
});
