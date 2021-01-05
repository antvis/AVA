import { get } from 'lodash';
import { dataToDataProps, dataPropsToAdvices, autoChart } from '../../src';
import { city_sex_active_trade } from '../data/nominal*n+interval*n';
import { createDiv } from '../utils/dom';

describe('Chart Type - Spreadsheet', () => {
  it('basic', async () => {
    const dataProps = dataToDataProps(city_sex_active_trade);
    const advices = dataPropsToAdvices(dataProps, {}, false);
    expect(advices.length > 0 && advices[0].type === 'spreadsheet').toEqual(true);

    const div = createDiv('spreadsheet in autoChart');
    div.style.height = '400px';
    div.style.boxSizing = 'border-box';
    const autoChartIns = await autoChart(div, city_sex_active_trade, { toolbar: true });
    const plot = autoChartIns.getPlot();
    const types = get(plot, 'advices', []).map((i) => i.type);
    expect(types.includes('spreadsheet')).toEqual(true);
  });
});
