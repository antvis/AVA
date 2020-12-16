import { autoChart } from '../../src';
import { createDiv } from '../utils/dom';
import { city_gender_amount } from '../data/nominal*2+interval*1_incomplete';

describe('Chart Type - Grouped Column Chart', () => {
  it('basic', () => {
    const div = createDiv('分组柱图');
    div.style.height = '400px';
    div.style.boxSizing = 'border-box';
    autoChart(div, city_gender_amount, { toolbar: true });
  });
});
