import { urlDataSpec } from '../../specs/data';
import { g2Adaptor } from '../../../src';
describe('spec.data', () => {
  it('fetch data by url', async () => {
    const config = await g2Adaptor(urlDataSpec);
    //@ts-ignore
    const data = await (await fetch(urlDataSpec.data.url)).json();
    expect(config.data.length).toEqual(data.length);
  });
});
