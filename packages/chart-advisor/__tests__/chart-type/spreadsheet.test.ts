import { get } from 'lodash';
import { dataToDataProps, dataPropsToAdvices, autoChart } from '../../src';
import { city_sex_active_trade } from '../data/nominal*n+interval*n';
import { createDiv } from '../utils/dom';

describe('Chart Type - Spreadsheet', () => {
  it('basic', async () => {
    const dataProps = dataToDataProps(city_sex_active_trade);
    const advices = dataPropsToAdvices(dataProps, {}, false);
    console.log('advices: ', dataProps, advices);
    expect(advices.length > 0 && advices[0].type === 'spreadsheet').toEqual(true);

    // Test the effect on autoChart
    const div = createDiv('1 col - kpi_chart');
    div.style.height = '400px';
    div.style.boxSizing = 'border-box';
    const autoChartIns = await autoChart(div, city_sex_active_trade, { toolbar: true });
    const plot = autoChartIns.getPlot();
    const types = get(plot, 'advices', []).map((i) => i.type);
    expect(types.includes('kpi_chart')).toEqual(false);
  });
});
