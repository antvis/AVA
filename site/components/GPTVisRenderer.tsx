'use client';
import { useEffect, useRef } from 'react';
import { GPTVis } from '@antv/gpt-vis';

interface GPTVisRendererProps {
  syntax: string;
  width?: number;
  height?: number;
  /** Show gpt-vis's built-in Chart/Code tabs (default: false) */
  wrapper?: boolean;
  onRender?: () => void;
  onError?: (error: Error) => void;
}

const GPTVisRenderer: React.FC<GPTVisRendererProps> = ({ syntax, width, height, wrapper = false, onRender, onError }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<GPTVis | null>(null);

  // Mount: create instance once. Unmount: destroy.
  useEffect(() => {
    if (!containerRef.current) return;

    const instance = new GPTVis({
      container: containerRef.current,
      width,
      height,
      theme: 'light',
      wrapper,
    });
    instanceRef.current = instance;

    return () => {
      instance.destroy();
      instanceRef.current = null;
    };
  }, [width, height]);

  // Update: re-render when syntax or dimensions change.
  useEffect(() => {
    if (!instanceRef.current || !syntax) return;

    try {
      instanceRef.current.render(normalizeVisInput(syntax));
      onRender?.();
    } catch (err) {
      onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  }, [syntax, width, height]);

  return <div ref={containerRef} className="w-full h-full" />;
};

/**
 * @antv/gpt-vis >= 1.0 only recognizes its own `vis [type]` DSL, so legacy
 * “```vis-chart {json}```” fences fall back to raw-text rendering. Extract
 * fenced JSON configs and hand GPTVis a plain object instead — render()
 * accepts objects natively. Native DSL passes through untouched.
 */
function normalizeVisInput(syntax: string): string | Record<string, unknown> {
  const trimmed = syntax.trim();
  if (trimmed.startsWith('vis ') || typeof trimmed !== 'string') return syntax;

  const fence = trimmed.match(/^```(?:vis-chart)?\s*([\s\S]*?)\s*```$/);
  const candidates = fence ? [fence[1]] : [trimmed, trimmed.replace(/```vis-chart|```/g, '').trim()];

  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      return JSON.parse(candidate);
    } catch {
      // not JSON — keep trying / fall through
    }
  }
  return syntax;
}

export default GPTVisRenderer;
