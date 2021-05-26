// FIXME

describe('', () => {
  test('', () => {
    console.log('fixme');
  });
});

// import { isDateColumn } from '../../../src/data-parse';

// describe('UNIT TEST - chart-linter/data-parse/isDate', () => {
//   test('should work for date columns', () => {
//     expect(isDateColumn(['199901', '199902', '199903', '199904', '199912'])).toBe(true);

//     expect(isDateColumn(['2010-08-01', '2010-08-02', '2010-08-03', '2010-08-04', '2010-08-05', '2010-08-06'])).toBe(
//       true
//     );

//     expect(
//       isDateColumn(['2020/01/01', '2020/02/01', '2020/03/01', '2020/04/01', '2020/05/01', '2020/06/01', '2020/12/01'])
//     ).toBe(true);

//     expect(
//       isDateColumn([
//         '2010-08-01 00:00:00',
//         '2010-08-01 05:00:00',
//         '2010-08-01 09:00:00',
//         '2010-08-01 14:00:00',
//         '2010-08-01 24:00:00',
//       ])
//     ).toBe(true);

//     // mixed
//     expect(isDateColumn(['2020/01/01', '2010-08-01', '199901', '2010-08-01 14:00:00', '1/1/1999'])).toBe(true);
//   });

//   test('should reject invalid columns', () => {
//     expect(isDateColumn(['a', 'b', 'c', 'd', 'e'])).toBe(false);

//     expect(isDateColumn(['2010-08-01', '2010-08-02', '2010-08-03', '2010-08-04', '2010-08-05', '2010-08-32'])).toBe(
//       false
//     );

//     expect(
//       isDateColumn(['2020/01/01', '2020/02/01', '2020/03/01', '2020/04/01', '2020/05/01', '2020/12/01', '2020/13/01'])
//     ).toBe(false);

//     expect(
//       isDateColumn([
//         '2010-08-01 00:00:00',
//         '2010-08-01 05:00:00',
//         '2010-08-01 09:00:00',
//         '2010-08-01 24:00:00',
//         '2010-08-01 25:00:00',
//       ])
//     ).toBe(false);
//   });
// });
