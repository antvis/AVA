import { autoChart } from '../../src';
import { createDiv } from '../utils/dom';

const data = [
  { subcat: '投影仪', sales: 8611876.83, cat: '设备' },
  { subcat: '电话', sales: 3748330.01, cat: '设备' },
  { subcat: '复印机', sales: 3601334.1, cat: '设备' },
  { subcat: '配件', sales: 1926153.38, cat: '设备' },
  { subcat: '椅子', sales: 271451.62, cat: '家具' },
  { subcat: '书架', sales: 89510.6, cat: '家具' },
  { subcat: '桌子', sales: 74242.53, cat: '家具' },
  { subcat: '柜子', sales: 73628.46, cat: '家具' },
  { subcat: '信封', sales: 4499.55, cat: '办公用品' },
  { subcat: '橡皮', sales: 4065.6, cat: '办公用品' },
  { subcat: '本子', sales: 3893.76, cat: '办公用品' },
  { subcat: '收纳具', sales: 3834.6, cat: '办公用品' },
  { subcat: '纸张', sales: 3168.54, cat: '办公用品' },
  { subcat: '胶带', sales: 1350.54, cat: '办公用品' },
  { subcat: '便签纸', sales: 1110.41, cat: '办公用品' },
  { subcat: '装订机', sales: 905.58, cat: '办公用品' },
  { subcat: '笔', sales: 810.54, cat: '办公用品' },
];

describe('hierarchy cat and subcat', () => {
  it('check', async () => {
    const div = createDiv('Cat and sub-Cat');
    div.style.height = '400px';
    div.style.boxSizing = 'border-box';
    const autoChartIns = await autoChart(div, data, { purpose: 'Proportion' });
    const plot = autoChartIns.getPlot();
    // @ts-ignore
    console.log(plot.advices[0].spec);
    // expect(plot?.type).toBeTruthy;
    // expect(['column_chart', 'bar_chart'].includes(plot?.type!)).toBe(true);
  });
});
