import { autoChart } from '../../src';
import { createDiv } from '../utils/dom';

const data = [
  { subcat: 'projector', sales: 8611876.83, cat: 'equipment' },
  { subcat: 'phone', sales: 3748330.01, cat: 'equipment' },
  { subcat: 'copier', sales: 3601334.1, cat: 'equipment' },
  { subcat: 'accessories', sales: 1926153.38, cat: 'equipment' },
  { subcat: 'chair', sales: 271451.62, cat: 'furniture' },
  { subcat: 'book shelf', sales: 89510.6, cat: 'furniture' },
  { subcat: 'table', sales: 74242.53, cat: 'furniture' },
  { subcat: 'cabinet', sales: 73628.46, cat: 'furniture' },
  { subcat: 'envelope', sales: 4499.55, cat: 'office supplies' },
  { subcat: 'rubber', sales: 4065.6, cat: 'office supplies' },
  { subcat: 'book', sales: 3893.76, cat: 'office supplies' },
  { subcat: 'storage equipment', sales: 3834.6, cat: 'office supplies' },
  { subcat: 'paper', sales: 3168.54, cat: 'office supplies' },
  { subcat: 'tape', sales: 1350.54, cat: 'office supplies' },
  { subcat: 'sticky notes', sales: 1110.41, cat: 'office supplies' },
  { subcat: 'binding machine', sales: 905.58, cat: 'office supplies' },
  { subcat: 'pen', sales: 810.54, cat: 'office supplies' },
];

describe('hierarchy cat and subcat', () => {
  it('check', async () => {
    const div = createDiv('Cat and sub-Cat');
    div.style.height = '400px';
    div.style.boxSizing = 'border-box';
    const autoChartIns = await autoChart(div, data, { purpose: 'Proportion' });
    const plot = autoChartIns.getPlot();
    expect(plot?.type === 'percent_stacked_column_chart').toBe(true);
  });
});
