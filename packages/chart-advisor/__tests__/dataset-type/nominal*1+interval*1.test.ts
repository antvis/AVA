import { dataToDataProps, dataPropsToAdvices, autoChart } from '../../src';
import { area_sales as dataset } from '../data/nominal*1+interval*1';
import { createDiv } from '../utils/dom';

describe('DataSet - nominal*1+interval*1', () => {
  describe('with Value purpose', () => {
    test('should recommend table by pipeline', () => {
      const dataProps = dataToDataProps(dataset);
      const advices = dataPropsToAdvices(dataProps, { purpose: 'Value' });
      expect(advices.length > 0 && advices[0].type === 'table').toEqual(true);
    });

    test('should recommend table by autoChart with configs', async () => {
      const div = createDiv('nominal*1+interval*1 Value');
      div.style.height = '400px';
      div.style.boxSizing = 'border-box';
      const autoChartIns = await autoChart(div, dataset, {
        toolbar: true,
        chartRuleConfigs: { 'all-can-be-table': { weight: 1 } },
        purpose: 'Value',
      });
      const plot = autoChartIns.getPlot();
      expect(plot?.type === 'table').toBe(true);
    });
  });

  describe('with Proportion purpose', () => {
    test('should recommend pie_chart by pipeline', () => {
      const dataProps = dataToDataProps(dataset);
      const advices = dataPropsToAdvices(dataProps, { purpose: 'Proportion' });
      expect(advices.length > 0 && advices[0].type === 'pie_chart').toEqual(true);
    });

    test('should recommend pie_chart by autoChart with configs', async () => {
      const div = createDiv('nominal*1+interval*1 Proportion');
      div.style.height = '400px';
      div.style.boxSizing = 'border-box';
      const autoChartIns = await autoChart(div, dataset, {
        toolbar: true,
        chartRuleConfigs: { 'all-can-be-table': { weight: 1 } },
        purpose: 'Proportion',
      });
      const plot = autoChartIns.getPlot();
      expect(plot?.type === 'pie_chart').toBe(true);
    });
  });

  describe('with Rank purpose', () => {
    test('should recommend column_chart by pipeline', () => {
      const dataProps = dataToDataProps(dataset);
      const advices = dataPropsToAdvices(dataProps, { purpose: 'Rank' });
      expect(advices.length > 0 && advices[0].type === 'column_chart').toEqual(true);
    });

    test('should recommend column_chart by autoChart with configs', async () => {
      const div = createDiv('nominal*1+interval*1 Rank');
      div.style.height = '400px';
      div.style.boxSizing = 'border-box';
      const autoChartIns = await autoChart(div, dataset, {
        toolbar: true,
        chartRuleConfigs: { 'all-can-be-table': { weight: 1 } },
        purpose: 'Rank',
      });
      const plot = autoChartIns.getPlot();
      expect(plot?.type === 'column_chart').toBe(true);
    });
  });
});
