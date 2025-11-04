import { bindRenderer } from '../../src';
import { RENDERER } from '../../src/bind';

describe('bindRenderer', () => {
  it('bindRenderer', async () => {
    expect(RENDERER).toBeNull();
    const mockRenderer = jest.fn();
    bindRenderer(mockRenderer);
    expect(RENDERER).toBe(mockRenderer);
  });
});
