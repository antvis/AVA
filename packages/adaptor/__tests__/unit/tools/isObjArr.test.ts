import { isObjArr } from '../../../src/utils';

describe('is Object Array', () => {
  it('string is not object arr', () => {
    const bol = isObjArr('ss');
    expect(bol).toBe(false);
  });

  it('string arr is not object arr', () => {
    const bol = isObjArr(['ss', 'dd']);
    expect(bol).toBe(false);
  });

  it('Record<string, any>[] is object arr', () => {
    const bol = isObjArr([{ a: 'A', b: 12 }]);
    expect(bol).toBe(true);
  });

  it('hybrid arr is not object arr', () => {
    const bol = isObjArr([{ a: 'A', b: 12 }, 12]);
    expect(bol).toBe(false);
  });
});
