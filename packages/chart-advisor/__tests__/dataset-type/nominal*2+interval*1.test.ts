import { dataToDataProps, dataPropsToAdvices, autoChart } from '../../src';
import { city_gender_amount_complete as dataset1, hier_categories as dataset2 } from '../data/nominal*2+interval*1';
import { createDiv } from '../utils/dom';

describe('DataSet - nominal*2+interval*1', () => {
  describe('with Value purpose', () => {
    test('should recommend table by pipeline', () => {
      const dataProps = dataToDataProps(dataset1);
      const advices = dataPropsToAdvices(dataProps, { purpose: 'Value' });
      expect(advices.length > 0 && advices[0].type === 'table').toEqual(true);
    });

    test('should recommend table by autoChart with configs', async () => {
      const div = createDiv('nominal*2+interval*1 Value');
      div.style.height = '400px';
      div.style.boxSizing = 'border-box';
      const autoChartIns = await autoChart(div, dataset1, {
        toolbar: true,
        chartRuleConfigs: { 'all-can-be-table': { weight: 1 } },
        purpose: 'Value',
      });
      const plot = autoChartIns.getPlot();
      expect(plot?.type === 'table').toBe(true);
    });
  });

  describe('with Proportion purpose', () => {
    test('should recommend percent_stacked_column_chart by pipeline', () => {
      const dataProps = dataToDataProps(dataset1);
      const advices = dataPropsToAdvices(dataProps, { purpose: 'Proportion' });
      expect(advices.length > 0 && advices[0].type === 'percent_stacked_column_chart').toEqual(true);
    });

    test('should recommend percent_stacked_column_chart by autoChart with configs', async () => {
      const div = createDiv('nominal*1+interval*1 Proportion');
      div.style.height = '400px';
      div.style.boxSizing = 'border-box';
      const autoChartIns = await autoChart(div, dataset1, {
        toolbar: true,
        chartRuleConfigs: { 'all-can-be-table': { weight: 1 } },
        purpose: 'Proportion',
      });
      const plot = autoChartIns.getPlot();
      expect(plot?.type === 'percent_stacked_column_chart').toBe(true);
    });
  });

  test('should recommend percent_stacked_column_chart by pipeline', () => {
    const dataProps = dataToDataProps(dataset2);
    const advices = dataPropsToAdvices(dataProps, { purpose: 'Proportion' }, true);
    expect(advices.length > 0 && advices[0].type === 'percent_stacked_column_chart').toEqual(true);
  });

  test('should recommend percent_stacked_column_chart by autoChart with configs', async () => {
    const div = createDiv('nominal*1+interval*1 Proportion 2');
    div.style.height = '400px';
    div.style.boxSizing = 'border-box';
    const autoChartIns = await autoChart(div, dataset2, {
      toolbar: true,
      chartRuleConfigs: { 'all-can-be-table': { weight: 1 } },
      purpose: 'Proportion',
    });
    const plot = autoChartIns.getPlot();
    expect(plot?.type === 'percent_stacked_column_chart').toBe(true);
  });
});
