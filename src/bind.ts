import { Renderer } from './types/render';

// The renderer function bound from outside.
// Default is null.
// We suggest to bind the renderer function during initialization with AntV GPT-Vis and mcp.
let RENDERER: Renderer | null = null;

export function bindRenderer(fn: Renderer) {
  RENDERER = fn;
}

export function getRenderer() {
  return RENDERER;
}
