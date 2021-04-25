// https://github.com/antvis/AVA/issues/116
// autoChart multiple execution errors
import { autoChart } from '../../src';
import { createDiv } from '../utils/dom';

const data1 = [
  { region: 'East', sales: 4684.44 },
  { region: 'North', sales: 4137.09 },
  { region: 'NorthEast', sales: 2681.46 },
  { region: 'SouthEast', sales: 2447.01 },
  { region: 'SouthWest', sales: 818.59 },
  { region: 'NorthWest', sales: 1303.5 },
];

const data2 = [
  { region: 'East', sales: 4684.44 },
  { region: 'North', sales: 4137.09 },
  { region: 'NorthEast', sales: 8681.46 },
  { region: 'SouthEast', sales: 2447.01 },
  { region: 'SouthWest', sales: 6818.59 },
  { region: 'NorthWest', sales: 1303.5 },
];

function clickBtn(div, data, ms) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(autoChart(div, data, { toolbar: false, development: true }));
      } catch (err) {
        reject('error');
      }
    }, ms);
  });
}

describe('multiple execution errors', () => {
  it('', async () => {
    const div = createDiv('ColumnCharts');
    div.style.height = '400px';
    div.style.boxSizing = 'border-box';

    autoChart(div, data1, { toolbar: false, development: true });

    const click1 = await clickBtn(div, data2, 100);
    // @ts-ignore
    const plot = click1.getPlot();
    expect((plot as any).data[2].sales).toBe(data2[2].sales);

    const click2 = await clickBtn(div, data1, 200);
    // @ts-ignore
    const plot = click2.getPlot();
    expect((plot as any).data[2].sales).toBe(data1[2].sales);
  });
});
