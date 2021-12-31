import { factory as normalFactory } from '@stdlib/random/base/normal';
import { extractor } from '../../src/insights/extractors/distribution';

const normalRunif = normalFactory(0.0, 1.0, {
  seed: 8798,
});

const normalRandomData = new Array(100);
for (let i = 0; i < normalRandomData.length; i += 1) {
  normalRandomData[i] = { y: normalRunif() };
}

describe('extract distribution insight', () => {
  test('check normal distribution', () => {
    const result = extractor(normalRandomData, [], [{ field: 'y', method: 'SUM' }]);
    expect(result[0]?.distribution).toEqual('normal');
  });
});
