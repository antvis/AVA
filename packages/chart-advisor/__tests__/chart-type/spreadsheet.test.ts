import { get } from 'lodash';
import { dataToDataProps, dataPropsToAdvices, autoChart } from '../../src';
import { city_sex_active_trade } from '../data/nominal*n+interval*n';
import { createDiv } from '../utils/dom';

describe('Chart Type - table', () => {
  it('pipeline', async () => {
    const dataProps = dataToDataProps(city_sex_active_trade);
    const advicesWithTable = dataPropsToAdvices(dataProps);
    expect(advicesWithTable.length > 0 && advicesWithTable[0].type === 'table').toEqual(true);

    const advicesWithoutTable = dataPropsToAdvices(
      dataProps,
      {
        chartRuleConfigs: {
          'all-can-be-table': {
            weight: 0,
          },
        },
      },
      false
    );
    expect(advicesWithoutTable.length).toEqual(0);
  });

  it('autoChart default without table', async () => {
    const div = createDiv('table without autoChart');
    div.style.height = '400px';
    div.style.boxSizing = 'border-box';
    const autoChartIns = await autoChart(div, city_sex_active_trade, { toolbar: true });
    const plot = autoChartIns.getPlot();
    const types = get(plot, 'advices', []).map((i) => i.type);
    expect(types.includes('table')).toEqual(false);
  });

  it('autoChart default with table', async () => {
    const div = createDiv('table without autoChart');
    div.style.height = '400px';
    div.style.boxSizing = 'border-box';
    const autoChartIns = await autoChart(div, city_sex_active_trade, {
      toolbar: true,
      development: true,
      chartRuleConfigs: {
        'all-can-be-table': {
          weight: 1,
        },
      },
    });
    const plot = autoChartIns.getPlot();
    const types = get(plot, 'advices', []).map((i) => i.type);
    expect(types.includes('table')).toEqual(true);
  });
});
