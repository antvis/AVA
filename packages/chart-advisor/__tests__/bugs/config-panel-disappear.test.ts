// 2021-05-21 清妤(Amy) feedback
import { autoChart } from '../../src';
import { createDiv } from '../utils/dom';
import { wait } from '../utils/wait';

describe('config penal disappear', () => {
  it('auto chart', async () => {
    const div = createDiv('ColumnCharts');
    div.style.height = '400px';
    div.style.boxSizing = 'border-box';
    const data = [
      { city: 'a', gender: 'w', amount: 12 },
      { city: 'b', gender: 'w', amount: 14 },
      { city: 'b', gender: 'm', amount: 4 },
      { city: 'c', gender: 'w', amount: 18 },
    ];
    await autoChart(div, data, { toolbar: false, development: true });
    await wait();
    const panelHandlerDom = div.querySelector('.__AUTO_CHART__config_btn');
    expect(panelHandlerDom).toBeTruthy();
  });
});
