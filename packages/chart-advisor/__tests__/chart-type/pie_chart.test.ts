import { autoChart } from '../../src';
import { createDiv } from '../utils/dom';
import { area_sales } from '../data/nominal*1+interval*1';

describe('Chart Type - Pie Chart', () => {
  it('basic', async () => {
    const div = createDiv('PieCharts');
    div.style.height = '400px';
    div.style.boxSizing = 'border-box';
    const autoChartIns = await autoChart(div, area_sales, { toolbar: true, purpose: 'Composition' });
    const plot = autoChartIns.getPlot();
    expect(plot?.type).toBeTruthy;
    expect(['pie_chart', 'ring_chart'].includes(plot?.type!)).toEqual(true);
  });
});
