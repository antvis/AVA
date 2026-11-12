'use client';
import { useEffect, useRef } from 'react';
import { GPTVis } from '@antv/gpt-vis';

interface GPTVisRendererProps {
  config: Parameters<GPTVis['render']>[0];
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
    const instance = instanceRef.current;
    if (!instance || !config) return;
    let active = true;
    void (async () => {
      try {
        await instance.render(config);
        if (active) onRender?.();
      } catch (err) {
        if (active) onError?.(err instanceof Error ? err : new Error(String(err)));
      }
    })();
    return () => {
      active = false;
    };
  }, [config, width, height]);

  return <div ref={containerRef} className="w-full h-full" />;
};

export default GPTVisRenderer;
