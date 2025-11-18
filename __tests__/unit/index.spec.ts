import { AVA, bindRenderer } from '../../src';

describe('index', () => {
  it('AVA', async () => {
    expect(AVA).toBeDefined();
  });

  it('bindRenderer', async () => {
    expect(bindRenderer).toBeInstanceOf(Function);
  });
});
