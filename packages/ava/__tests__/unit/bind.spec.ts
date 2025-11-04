import { bindRenderer, getRenderer } from '../../src/bind';

describe('bindRenderer', () => {
  it('bindRenderer', async () => {
    expect(getRenderer()).toBeNull();
    const mockRenderer = jest.fn();
    bindRenderer(mockRenderer);
    expect(getRenderer()).toBe(mockRenderer);
  });
});
