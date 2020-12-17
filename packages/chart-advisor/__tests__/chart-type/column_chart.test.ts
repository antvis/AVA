import { autoChart } from '../../src';
import { createDiv } from '../utils/dom';
import { area_sales } from '../data/nominal*1+interval*1';

describe('Chart Type - Column Chart', () => {
  it('basic', async () => {
    const div = createDiv('分组柱图');
    div.style.height = '400px';
    div.style.boxSizing = 'border-box';
    const autoChartIns = await autoChart(div, area_sales, { toolbar: true });
    const plot = autoChartIns.getPlot();
    expect(plot?.type).toBeTruthy;
    expect(['column_chart', 'bar_chart'].includes(plot?.type!)).toBe(true);
  });
});
