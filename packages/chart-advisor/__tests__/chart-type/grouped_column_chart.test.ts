import { autoChart } from '../../src';
import { createDiv } from '../utils/dom';
import {
  city_gender_amount_complete,
  city_gender_amount_incomplete,
  area_series_sales_complete,
} from '../data/nominal*2+interval*1';

// TODO 在窄屏下堆叠条形图和分组条形图推荐分数相同，且无法通过意图增加权重，之后可以考虑一下如何处理
describe('Chart Type - Grouped Column Chart', () => {
  it('2series - complete', async () => {
    const div = createDiv('2 series - complete data - Grouped ColumnCharts');
    div.style.height = '400px';
    div.style.boxSizing = 'border-box';
    const autoChartIns = await autoChart(div, city_gender_amount_complete, { purpose: 'Comparison', toolbar: true });
    const plot = autoChartIns.getPlot();
    expect(plot?.type).toBeTruthy;
    expect(['grouped_column_chart', 'grouped_bar_chart', 'stacked_bar_chart'].includes(plot?.type!)).toBe(true);
  });

  it('2series - incomplete', async () => {
    const div = createDiv('2 series - incomplete data - Grouped ColumnCharts');
    div.style.height = '400px';
    div.style.boxSizing = 'border-box';
    const autoChartIns = await autoChart(div, city_gender_amount_incomplete, { toolbar: true });
    const plot = autoChartIns.getPlot();
    expect(plot?.type).toBeTruthy;
    expect(['grouped_column_chart', 'grouped_bar_chart', 'stacked_bar_chart'].includes(plot?.type!)).toBe(true);
  });

  it('3series - complete', async () => {
    const div = createDiv('3 series - incomplete data - Grouped ColumnCharts');
    div.style.height = '400px';
    div.style.boxSizing = 'border-box';
    const autoChartIns = await autoChart(div, area_series_sales_complete, { toolbar: true });
    const plot = autoChartIns.getPlot();
    // feature g2plot 优化 https://github.com/antvis/G2/issues/3133
    expect(plot?.type).toBeTruthy;
    expect(['grouped_column_chart', 'grouped_bar_chart', 'stacked_bar_chart'].includes(plot?.type!)).toBe(true);
  });
});
