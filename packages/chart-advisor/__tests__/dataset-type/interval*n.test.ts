import { dataToDataProps, dataPropsToAdvices } from '../../src';
import { totalPrice as dataset1, all_about_money as dataset2 } from '../data/interval*n';

describe('DataSet - interval*n with 1 record', () => {
  describe('Results', () => {
    test('should recommend kpi panel by pipeline', async () => {
      const dataProps = dataToDataProps(dataset1);
      const advicesWithTable = dataPropsToAdvices(dataProps);
      expect(advicesWithTable.length > 0 && advicesWithTable[0].type === 'kpi_panel').toEqual(true);
    });
  });
});

describe('DataSet - interval*n with multi records', () => {
  describe('Results', () => {
    test('should recommend table by pipeline', async () => {
      const dataProps = dataToDataProps(dataset2);
      const advicesWithTable = dataPropsToAdvices(dataProps);
      expect(advicesWithTable.length > 0 && advicesWithTable[0].type === 'table').toEqual(true);
    });
  });
});
