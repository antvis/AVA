'use client';
import { useEffect, useRef } from 'react';
import { GPTVis } from '@antv/gpt-vis';

interface GPTVisRendererProps {
  config: Record<string, unknown>;
  width?: number;
  height?: number;
  /** Show gpt-vis's built-in Chart/Code tabs (default: false) */
  wrapper?: boolean;
  onRender?: () => void;
  onError?: (error: Error) => void;
}

const GPTVisRenderer: React.FC<GPTVisRendererProps> = ({ config, width, height, wrapper = false, onRender, onError }) => {
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

  // Update: re-render when config or dimensions change.
  useEffect(() => {
    if (!instanceRef.current || !config) return;

    try {
      instanceRef.current.render(config);
      onRender?.();
    } catch (err) {
      onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  }, [config, width, height]);

  return <div ref={containerRef} className="w-full h-full" />;
};

export default GPTVisRenderer;
