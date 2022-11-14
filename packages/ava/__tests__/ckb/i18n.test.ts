import { ckbDict } from '../../src/ckb';

describe('api - ckbDict', () => {
  test('ckbDict returns translation list', () => {
    // return object
    const cn = ckbDict('zh-CN');
    expect(!!cn).toBe(true);
    expect(Object.keys(cn)).toEqual(['concepts', 'chartTypes']);
    expect(cn.concepts.lom.Nominal).toBe('无序名词');
  });
});
