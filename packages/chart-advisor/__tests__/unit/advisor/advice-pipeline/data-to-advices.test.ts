import { dataToAdvices } from '../../../../src/advisor/advice-pipeline/data-to-advices';
import { builtInRules, getChartRules } from '../../../../src/ruler';
import { DataFrame } from '../../../../../data-wizard';
import { CKBJson } from '../../../../../ckb';

describe('UNIT TEST: dataToAdvices', () => {
  test('should assign score to chartType without toSpec', () => {
    const testData = [
      { f1: 'a', f2: 10 },
      { f1: 'b', f2: 10 },
      { f1: 'c', f2: 10 },
    ];

    const dataFrame = new DataFrame(testData);
    const dataProps = dataFrame.info();
    const ruleBase = getChartRules(builtInRules);

    // custom chart
    const ironBallChart = {
      id: 'ironball_chart',
      name: 'IronBall Chart',
      alias: ['solidball'],
      family: ['PieCharts'],
      def: 'A funny chart.',
      purpose: ['Comparison'],
      coord: ['Cartesian2D'],
      category: ['Statistic'],
      shape: ['Round'],
      dataPres: [
        { minQty: 1, maxQty: '*', fieldConditions: ['Nominal'] },
        { minQty: 1, maxQty: '*', fieldConditions: ['Interval'] },
      ],
      channel: ['Angle', 'Area', 'Color'],
      recRate: 'Use with Caution',
      // toSpec: undefined
    };

    const ckb: any = CKBJson('en-US', true);
    ckb.ironball_chart = ironBallChart;

    const resultRequireSpecByDefault = dataToAdvices(testData, dataProps, ckb, ruleBase);
    const customChartAdvice1 = resultRequireSpecByDefault.find((advice) => advice.type === 'ironball_chart');
    expect(customChartAdvice1).toBe(undefined);

    const resultNotRequireSpec = dataToAdvices(testData, dataProps, ckb, ruleBase, false, { requireSpec: false });
    const customChartAdvice2 = resultNotRequireSpec.find((advice) => advice.type === 'ironball_chart');
    expect(!!customChartAdvice2).toBe(true);
  });
});
