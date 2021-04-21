import { get } from 'lodash';
import { dataToDataProps, dataPropsToAdvices, autoChart } from '../../src';
import { totalPrice, price_cost } from '../data/interval*n';
import { createDiv } from '../utils/dom';

describe('Chart Type - Kpi Panel', () => {
  it('one card', async () => {
    const dataProps = dataToDataProps(totalPrice);
    const advices = dataPropsToAdvices(dataProps);
    expect(advices.length > 0 && advices[0].type === 'kpi_panel').toEqual(true);

    const div = createDiv('1 col - kpi_panel');
    div.style.height = '400px';
    div.style.boxSizing = 'border-box';
    const autoChartIns = await autoChart(div, totalPrice, { toolbar: true, development: true });
    const plot = autoChartIns.getPlot();
    const types = get(plot, 'advices', []).map((i) => i.type);
    expect(types.includes('kpi_panel')).toEqual(true);
  });

  it('two card', async () => {
    const dataProps = dataToDataProps(price_cost);
    const advices = dataPropsToAdvices(dataProps);
    expect(advices.length > 0 && advices[0].type === 'kpi_panel').toEqual(true);

    const div = createDiv('2 cols - kpi_panel');
    div.style.height = '400px';
    div.style.boxSizing = 'border-box';
    const autoChartIns = await autoChart(div, price_cost, { toolbar: true });
    const plot = autoChartIns.getPlot();
    const types = get(plot, 'advices', []).map((i) => i.type);
    expect(types.includes('kpi_panel')).toEqual(true);
  });
});
