import { oneMoreValue } from '../src/smartMock';

test('oneMoreString', () => {
  console.log(oneMoreValue(['a', 'b', 'cde']));
  console.log(oneMoreValue(['a', 'a', 'cde']));
  console.log(oneMoreValue([1, 2, 3, 4]));
  console.log(oneMoreValue(['a', 'b', 2, 3]));
});
