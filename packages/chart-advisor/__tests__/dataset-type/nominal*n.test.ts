import { dataToDataProps, dataPropsToAdvices, autoChart } from '../../src';
import { categories } from '../data/nominal*n';
import { createDiv } from '../utils/dom';

describe('DataSet - nominal*n', () => {
  describe('Results', () => {
    test('should recommend table by pipeline', async () => {
      const dataProps = dataToDataProps(categories);
      const advicesWithTable = dataPropsToAdvices(dataProps);
      expect(advicesWithTable.length > 0 && advicesWithTable[0].type === 'table').toEqual(true);
    });

    test('should recommend table by autoChart with configs', async () => {
      const div = createDiv('table for nominals');
      div.style.height = '400px';
      div.style.boxSizing = 'border-box';
      const autoChartIns = await autoChart(div, categories, {
        chartRuleConfigs: { 'all-can-be-table': { weight: 1 } },
      });
      const plot = autoChartIns.getPlot();
      expect(plot?.type === 'table').toBe(true);
    });
  });
});
