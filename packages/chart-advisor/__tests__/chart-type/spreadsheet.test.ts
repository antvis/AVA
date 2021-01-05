import { get } from 'lodash';
import { dataToDataProps, dataPropsToAdvices, autoChart } from '../../src';
import { city_sex_active_trade } from '../data/nominal*n+interval*n';
import { createDiv } from '../utils/dom';

describe('Chart Type - Spreadsheet', () => {
  it('pipeline', async () => {
    const dataProps = dataToDataProps(city_sex_active_trade);
    const advicesWithSpreadsheet = dataPropsToAdvices(dataProps);
    expect(advicesWithSpreadsheet.length > 0 && advicesWithSpreadsheet[0].type === 'spreadsheet').toEqual(true);

    const advicesWithoutSpreadsheet = dataPropsToAdvices(
      dataProps,
      {
        chartRuleConfigs: {
          'all-can-be-spreadsheet': {
            weight: 0,
          },
        },
      },
      false
    );
    expect(advicesWithoutSpreadsheet.length).toEqual(0);
  });

  it('autoChart default without spreadsheet', async () => {
    const div = createDiv('spreadsheet without autoChart');
    div.style.height = '400px';
    div.style.boxSizing = 'border-box';
    const autoChartIns = await autoChart(div, city_sex_active_trade, { toolbar: true });
    const plot = autoChartIns.getPlot();
    const types = get(plot, 'advices', []).map((i) => i.type);
    expect(types.includes('spreadsheet')).toEqual(false);
  });

  it('autoChart default with spreadsheet', async () => {
    const div = createDiv('spreadsheet without autoChart');
    div.style.height = '400px';
    div.style.boxSizing = 'border-box';
    const autoChartIns = await autoChart(div, city_sex_active_trade, {
      toolbar: true,
      development: true,
      chartRuleConfigs: {
        'all-can-be-spreadsheet': {
          weight: 1,
        },
      },
    });
    const plot = autoChartIns.getPlot();
    const types = get(plot, 'advices', []).map((i) => i.type);
    expect(types.includes('spreadsheet')).toEqual(true);
  });
});
