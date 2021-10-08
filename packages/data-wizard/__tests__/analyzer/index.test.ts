import {
  analyzeField,
  isUnique,
  isOrdinal,
  isTime,
  isConst,
  isContinuous,
  isInterval,
  isDiscrete,
  isNominal,
  isNumberFieldInfo,
  isStringFieldInfo,
  isDateFieldInfo,
} from '../../src/analyzer';
import { assert } from '../../src/utils';

test('analyze integer', () => {
  const array = [0, 1, 2, 3, 4, 5, 6, 7, '+8', 9];
  const info = analyzeField(array);
  expect(info.type).toBe('integer');
  expect(info.recommendation).toBe('integer');

  assert(isNumberFieldInfo(info), 'Info is not NumberFieldInfo');

  expect(info.minimum).toBe(0);
  expect(info.maximum).toBe(9);
  expect(info.standardDeviation.toFixed(4)).toBe('2.8723');
  expect(isUnique(info)).toBe(true);
  expect(info.count).toBe(10);
  expect(info.distinct).toBe(10);
  expect(info.missing).toBe(0);
  expect(info.zeros).toBe(1);
  expect(info.sum).toBe(45);
  expect(info.variance).toBe(8.25);
});

test('analyze string integer', () => {
  const array = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const info = analyzeField(array);
  expect(info.type).toBe('integer');
  expect(info.recommendation).toBe('integer');

  assert(isNumberFieldInfo(info), 'Info is not NumberFieldInfo');

  expect(info.minimum).toBe(0);
  expect(info.maximum).toBe(9);
  expect(info.standardDeviation.toFixed(4)).toBe('2.8723');
  expect(isUnique(info)).toBe(true);
  expect(info.count).toBe(10);
  expect(info.distinct).toBe(10);
  expect(info.missing).toBe(0);
  expect(info.zeros).toBe(1);
  expect(info.sum).toBe(45);
  expect(info.variance).toBe(8.25);
});

test('analyze string float', () => {
  const array = ['0.1', '1.1', '2.1', '3.1', '4.1', '5.1', '6.1', '7.1', '8.1', '9.1'];
  const info = analyzeField(array);
  expect(info.type).toBe('float');
  expect(info.recommendation).toBe('float');

  assert(isNumberFieldInfo(info), 'Info is not NumberFieldInfo');

  expect(info.minimum).toBe(0.1);
  expect(info.maximum).toBe(9.1);
});

test('analyze number float', () => {
  const array = [0.1, 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1, 8.1, 9.1];
  const info = analyzeField(array);
  expect(info.type).toBe('float');
  expect(info.recommendation).toBe('float');

  assert(isNumberFieldInfo(info), 'Info is not NumberFieldInfo');

  expect(info.minimum).toBe(0.1);
  expect(info.maximum).toBe(9.1);
});

test('analyze mixed float', () => {
  const array = [1, 1.1, 2, 3.1, 4.1, 5.1, 6.1, 7.1, 8.1, 9.1];
  const info = analyzeField(array);
  expect(info.type).toBe('mixed');
  expect(info.recommendation).toBe('float');

  assert(isNumberFieldInfo(info), 'Info is not NumberFieldInfo');

  expect(info.minimum).toBe(1);
  expect(info.maximum).toBe(9.1);
});

test('analyze boolean', () => {
  const array = [true, false, true, true, true, true, true, false, false, false, null];
  const info = analyzeField(array);

  expect(info.type).toBe('string');
  expect(info.recommendation).toBe('boolean');
  expect(info.distinct).toBe(2);
  expect(info.count).toBe(11);
  expect(info.meta).toBeUndefined();
  expect(info.valueMap.false).toBe(4);
});

test('analyze 0 1 boolean', () => {
  const array = new Array(100).fill(undefined).map(() => {
    const t = [0, 1, null];
    return t[Math.floor(Math.random() * 3)];
  });
  const info = analyzeField(array);
  expect(info.type).toBe('integer');
  expect(info.recommendation).toBe('boolean');
  expect(info.distinct).toBe(2);
  expect(info.count).toBe(100);
});

test('analyze 男/女 boolean', () => {
  const array = new Array(100).fill(undefined).map(() => {
    const t = ['男', '女', ''];
    return t[Math.floor(Math.random() * 3)];
  });
  const info = analyzeField(array);

  expect(info.type).toBe('string');
  expect(info.recommendation).toBe('boolean');
  expect(info.distinct).toBe(2);
  expect(info.count).toBe(100);
});

test('analyze string boolean', () => {
  const array = new Array(100).fill(undefined).map(() => {
    const t = ['true', 'false', null];
    return t[Math.floor(Math.random() * 3)];
  });
  const info = analyzeField(array);
  expect(info.type).toBe('string');
  expect(info.recommendation).toBe('boolean');
  expect(info.distinct).toBe(2);
  expect(info.count).toBe(100);
  expect(info.meta).toBeUndefined();
});

test('empty string or string null as a null', () => {
  const array = ['', undefined, '', NaN, 'null', null, 'null', '', '', ''];
  const info = analyzeField(array);

  expect(info.type).toBe('null');
  expect(info.recommendation).toBe('null');
  expect(info.distinct).toBe(0);
  expect(info.count).toBe(10);
  expect(info.missing).toBe(10);
});

test('analyze string', () => {
  const array = ['type113', 'type14', 'type11321', 'type', 'type23', 'type2', 'type2', 'type2', 'type2', 'type2'];
  const info = analyzeField(array);
  expect(info.type).toBe('string');
  expect(info.recommendation).toBe('string');

  assert(isStringFieldInfo(info), 'Info is not StringFieldInfo');

  expect(info.minLength).toBe(4);
  expect(info.maxLength).toBe(9);
  expect(info.containsChar).toBe(true);
  expect(info.containsDigit).toBe(true);
  expect(info.containsSpace).toBe(false);
});

test('analyze mixed string', () => {
  const array = ['1', 'a', '2019-01-01', 'type', 'type23', 'type2', 'type2', 'type2', 'type2', 'type2'];
  const info = analyzeField(array);

  expect(info.type).toBe('mixed');
  expect(info.recommendation).toBe('string');
});

test('analyze date', () => {
  const array = [
    '2015-01-01',
    '2015-01-02',
    '2015-01-03',
    '2015-01-04',
    '2015-01-05',
    '2015-01-06',
    '2015-01-07',
    '2015-01-08',
    '2015-01-09',
    '2015-01-10',
  ];
  const info = analyzeField(array);

  expect(info.type).toBe('date');
  expect(info.recommendation).toBe('date');
  expect(info.count).toBe(10);
  expect(info.distinct).toBe(10);
});

test('analyze orginal date', () => {
  const array = [
    new Date('2015-01-01'),
    new Date('2015-01-02'),
    new Date('2015-01-03'),
    new Date('2015-01-04'),
    new Date('2015-01-05'),
    new Date('2015-01-06'),
    new Date('2015-01-07'),
    new Date('2015-01-08'),
    new Date('2015-01-09'),
    new Date('2015-01-10'),
  ];
  const info = analyzeField(array);

  expect(info.type).toBe('date');
  expect(info.recommendation).toBe('date');
  expect(info.count).toBe(10);
  expect(info.distinct).toBe(10);
});

test('analyze like string number', () => {
  const array = ['0.1', '1.1.1', '2.1.b', '3.1.c', '4.1.d', '5.1.e', '6.1.f', '7.1.g', '8.1.a', '9.1.c'];
  const info = analyzeField(array);
  expect(info.type).toBe('mixed');
  expect(info.recommendation).toBe('string');

  assert(isStringFieldInfo(info), 'Info is not StringFieldInfo');

  expect(info.maxLength).toBe(5);
  expect(info.minLength).toBe(3);
});

test('test isOrdinal ', () => {
  expect(isOrdinal(analyzeField(['Beijing', 'Shanghai', 'London']))).toBe(false);
  expect(isOrdinal(analyzeField(['第i周', '第iii周', '第iiii周', '第iiiii周', '第ii周', '第i周', '第ii周']))).toBe(
    false
  );
  expect(isOrdinal(analyzeField(['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日']))).toBe(true);
  expect(isOrdinal(analyzeField(['1', '2', '3', '4', '5', '6', '7']))).toBe(false);
  expect(isOrdinal(analyzeField(['a', 'a', 'a', 'a', 'a', 'a', 'a']))).toBe(false);
  expect(isOrdinal(analyzeField(['第一周', '第二周', '第三周', '第四周', '第五周', '第六周', '第七周']))).toBe(true);
  expect(isOrdinal(analyzeField(['A', 'B', 'C', 'D', 'E', 'F', 'G']))).toBe(false);
  expect(isOrdinal(analyzeField(['一月份', '二月份', '三月份', '四月份', '十月份', '十二月份', '十一月份']))).toBe(
    true
  );
  expect(isOrdinal(analyzeField(['第一季度', '第二季度', '第三季度', '第四季度']))).toBe(true);
});

test('test is xxx', () => {
  expect(isUnique(analyzeField([1, 2, 3, 4, 5, 6, 7, 8]))).toBe(true);
  expect(isTime(analyzeField(['1999', '2000', '2001', '2002', '2003', '2004', '2005']))).toBe(true);
  expect(isConst(analyzeField([1, 1, 1, 1, 1]))).toBe(true);
  expect(isContinuous(analyzeField([1.2, 2, 3, 4, 5, 6, 7]))).toBe(true);
  expect(isInterval(analyzeField([1, 2, 3, 4, 5, 6, 7]))).toBe(true);
  expect(isInterval(analyzeField([1.1, 2, 3, 4, 5, 6, 7]))).toBe(true);
  expect(isInterval(analyzeField([1.1, 2]))).toBe(true);
  expect(isNominal(analyzeField(['是', '否']))).toBe(true);
  expect(isDiscrete(analyzeField([1, 2, 3, 4, 5, 6, 7]))).toBe(true);
  expect(isNominal(analyzeField([1, 0, 1, 0, 1, 0, 1]))).toBe(true);
  expect(isNominal(analyzeField(['第i周', '第iii周', '第iiii周', '第iiiii周', '第ii周', '第i周', '第ii周']))).toBe(
    true
  );
  expect(isNominal(analyzeField([1, 2, 3, 4, 5, 6, 7]))).toBe(false);
});

test('int date - strict', () => {
  expect(analyzeField([1991, 1992, 1995, 1998, 1990, 2000, 2012, 2049]).type).toBe('integer');
  expect(analyzeField([1870, 1992, 1995, 1998, 1990, 2000, 2012, 2049]).recommendation).toBe('date');
  expect(analyzeField([1770, 1992, 1995, 1998, 1990, 2000, 2012, 2049]).recommendation).toBe('integer');
  expect(analyzeField([1770, 1992, 1995, 1998, 1990, 2000, 2012, 3049]).recommendation).toBe('integer');
  expect(analyzeField([1991, 1992, 1995, 1998, 1990, 2000, 2012, '']).type).toBe('integer');
  expect(analyzeField([1991, 1992, 1995, 1998, 1990, 2000, 2012, '2049']).recommendation).toBe('date');
  expect(analyzeField([199101, 199202, 199505, 199801, 199004, 200007, 201209, 204912]).type).toBe('integer');
  expect(analyzeField([199101, 199202, 199505, 199801, 199004, 200007, 201209, 204912]).recommendation).toBe('integer');
  expect(analyzeField([199101, 199202, 199519, 199801, 199004, 200007, 201209, 204912]).recommendation).toBe('integer');
  expect(
    analyzeField([19910110, 19920220, 19951230, 19980131, 19900411, 20000725, 20120918, 20491220]).recommendation
  ).toBe('integer');
});

test('date cols - strict', () => {
  const data = ['20190101', '20190102', '20190103', '20190716', '20190717', '20190718', '20190719'];
  const d = analyzeField(data);
  expect(d.type).toBe('integer');
  expect(d.recommendation).toBe('integer');
});

test('date cols', () => {
  const data = ['2019/01/01', '2019/01/02', '2019/01/03', '2019/07/16', '2019/07/17', '2019/07/18', '2019/07/19'];
  const d = analyzeField(data);
  expect(d.type).toBe('date');
  expect(d.recommendation).toBe('date');

  assert(isDateFieldInfo(d), 'd is not DateFieldInfo');

  expect(d.minimum).toBe('2019/01/01');
  expect(d.maximum).toBe('2019/07/19');
});

test('date cols', () => {
  const data = ['2019-01-01', '2019-01-02', '2019-01-03', '2019-07-16', '2019-07-17', '2019-07-18', '2019-07-19'];
  const d = analyzeField(data);
  expect(d.type).toBe('date');
  expect(d.recommendation).toBe('date');

  assert(isDateFieldInfo(d), 'd is not DateFieldInfo');

  expect(d.minimum).toBe('2019-01-01');
  expect(d.maximum).toBe('2019-07-19');
});

test('date cols not boolean', () => {
  const data = [
    '2019-01-01',
    '2019-01-02',
    '2019-01-01',
    '2019-01-02',
    '2019-01-01',
    '2019-01-02',
    '2019-01-01',
    '2019-01-02',
    '2019-01-01',
    '2019-01-02',
    '2019-01-01',
    '2019-01-02',
    '2019-01-01',
    '2019-01-02',
    '2019-01-01',
    '2019-01-02',
    '2019-01-01',
    '2019-01-02',
    '2019-01-01',
    '2019-01-02',
    '2019-01-01',
    '2019-01-02',
    '2019-01-01',
    '2019-01-02',
    '2019-01-01',
    '2019-01-02',
    '2019-01-01',
    '2019-01-02',
    '2019-01-01',
    '2019-01-02',
    '2019-01-01',
    '2019-01-02',
    '2019-01-01',
    '2019-01-02',
    '2019-01-01',
    '2019-01-02',
    '2019-01-01',
    '2019-01-02',
    '2019-01-01',
    '2019-01-02',
    '2019-01-01',
    '2019-01-02',
    '2019-01-01',
    '2019-01-02',
    '2019-01-01',
    '2019-01-02',
    '2019-01-01',
    '2019-01-02',
    '2019-01-01',
    '2019-01-02',
    '2019-01-01',
    '2019-01-02',
    '2019-01-01',
    '2019-01-02',
    '2019-01-01',
    '2019-01-02',
    '2019-01-01',
    '2019-01-02',
    '2019-01-01',
    '2019-01-02',
    '2019-01-01',
    '2019-01-02',
    '2019-01-01',
    '2019-01-02',
    '2019-01-01',
    '2019-01-02',
    '2019-01-01',
    '2019-01-02',
    '2019-01-01',
    '2019-01-02',
    '2019-01-01',
    '2019-01-02',
    '2019-01-01',
    '2019-01-02',
    '2019-01-01',
    '2019-01-02',
    '2019-01-01',
    '2019-01-02',
    '2019-01-01',
    '2019-01-02',
    '2019-01-01',
    '2019-01-02',
    '2019-01-01',
    '2019-01-02',
    '2019-01-01',
    '2019-01-02',
    '2019-01-01',
    '2019-01-02',
    '2019-01-01',
    '2019-01-02',
    '2019-01-01',
    '2019-01-02',
    '2019-01-01',
    '2019-01-02',
    '2019-01-01',
    '2019-01-02',
    '2019-01-01',
    '2019-01-02',
    '2019-01-01',
    '2019-01-02',
    '2019-01-01',
    '2019-01-02',
    '2019-01-01',
    '2019-01-02',
    '2019-01-01',
    '2019-01-02',
    '2019-01-01',
    '2019-01-02',
    '2019-01-01',
    '2019-01-02',
    '2019-01-01',
    '2019-01-02',
    '2019-01-01',
    '2019-01-02',
    '2019-01-01',
    '2019-01-02',
    '2019-01-01',
    '2019-01-02',
    '2019-01-01',
    '2019-01-02',
    '2019-01-01',
    '2019-01-02',
    '2019-01-01',
    '2019-01-02',
  ];
  const d = analyzeField(data);
  expect(d.type).toBe('date');
  expect(d.recommendation).toBe('date');

  assert(isDateFieldInfo(d), 'd is not DateFieldInfo');

  expect(d.minimum).toBe('2019-01-01');
  expect(d.maximum).toBe('2019-01-02');
});
