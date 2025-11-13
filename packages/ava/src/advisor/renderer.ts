import type { Renderer } from '@ava/types';

function createBinding() {
  let RENDERER: Renderer | null = null;

  function bindRenderer(fn: Renderer) {
    RENDERER = fn;
  }
  return {
    RENDERER,
    bindRenderer,
  };
}

const { RENDERER, bindRenderer } = createBinding();

export { RENDERER, bindRenderer };
