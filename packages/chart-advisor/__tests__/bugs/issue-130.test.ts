// https://github.com/antvis/AVA/issues/130
import { autoChart } from '../../src';
import { createDiv } from '../utils/dom';

const data1 = [
  { btag: 'fav', count: 997815 },
  { btag: 'pv', count: 1135028 },
  { btag: 'buy', count: 5388715 },
];

const data2 = [
  { btag: 'fav', count: 997815 },
  { btag: 'pv', count: 1135028 },
  { btag: 'buy', count: 5388715 },
  { btag: 'buy', count: 0 },
];

describe('strange data no result', () => {
  it('repetition', async () => {
    const div1 = createDiv('noresult1');
    div1.style.height = '400px';
    div1.style.boxSizing = 'border-box';

    const chart1 = await autoChart(div1, data1, { toolbar: false, development: true });
    console.log(chart1);
    // expect((chart1 as any).plot?.advices?.length > 0).toBe(true);

    const div2 = createDiv('noresult2');
    div2.style.height = '400px';
    div2.style.boxSizing = 'border-box';

    const chart2 = await autoChart(div2, data2, { toolbar: false, development: true });
    console.log(chart2);
    // expect((chart2 as any).plot.plot.chart.geometries[0].elements.length).toBe(3);
  });
});
