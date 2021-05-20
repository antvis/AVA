// FIXME

describe('', () => {
  test('', () => {
    console.log('fixme');
  });
});

// import { vl2asp } from '../../src/translator';
// import { fixer } from '../../src/fixer';
// import { Field, Rule } from '../../src/interfaces';

// describe('INTERGRATION TEST - pipeline', () => {
//   test('translator+fixer should work', () => {
//     const inputVL = {
//       data: { url: 'data/cars.json' },
//       mark: 'bar',
//       encoding: {
//         x: { field: 'Origin', aggregate: 'sum', bin: true, type: 'nominal' },
//         y: { field: 'Horsepower', type: 'quantitative', aggregate: 'sum' },
//       },
//     };

//     const rulesMock: Rule[] = [];

//     const fieldsMock: Field[] = [];

//     const output = {
//       fixable: false,
//       optimizedVL: {},
//       optimizedActions: [
//         {
//           action: 'REMOVE_AGGREGATE',
//           param1: 'x',
//           param2: '',
//         },
//       ],
//       allActions: [
//         {
//           action: 'REMOVE_AGGREGATE',
//           param1: 'x',
//           param2: '',
//         },
//       ],
//       rules: rulesMock,
//       originalVL: inputVL,
//     };

//     expect(fixer(inputVL as any, vl2asp(inputVL as any), rulesMock, fieldsMock)).toEqual(output);
//   });
// });
