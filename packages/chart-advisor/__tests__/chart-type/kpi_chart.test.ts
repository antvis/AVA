import { get } from 'lodash';
import { dataToDataProps, dataPropsToAdvices, autoChart } from '../../src';
import { totalPrice, price_cost } from '../data/interval*n';
import { createDiv } from '../utils/dom';

describe('Chart Type - Kpi Chart', () => {
  it('one card', async () => {
    const dataProps = dataToDataProps(totalPrice);
    const advices = dataPropsToAdvices(dataProps);
    expect(advices.length > 0 && advices[0].type === 'kpi_chart').toEqual(true);

    // 测试 pipeline 修改对 autoChart 没有影响
    const div = createDiv('1列数据 - 指标卡');
    div.style.height = '400px';
    div.style.boxSizing = 'border-box';
    const autoChartIns = await autoChart(div, totalPrice, { toolbar: true });
    const plot = autoChartIns.getPlot();
    const types = get(plot, 'advices', []).map((i) => i.type);
    expect(types.includes('kpi_chart')).toEqual(false);
  });

  it('two card', async () => {
    const dataProps = dataToDataProps(price_cost);
    const advices = dataPropsToAdvices(dataProps);
    expect(advices.length > 0 && advices[0].type === 'kpi_chart').toEqual(true);

    // 测试 pipeline 修改对 autoChart 没有影响
    const div = createDiv('2列数据 - 指标卡');
    div.style.height = '400px';
    div.style.boxSizing = 'border-box';
    const autoChartIns = await autoChart(div, price_cost, { toolbar: true });
    const plot = autoChartIns.getPlot();
    const types = get(plot, 'advices', []).map((i) => i.type);
    expect(types.includes('kpi_chart')).toEqual(false);
  });
});
