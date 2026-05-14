'use client';
import { useEffect, useRef } from 'react';
import { GPTVis } from '@antv/gpt-vis';

interface GPTVisRendererProps {
  syntax: string;
  width?: number;
  height?: number;
  onRender?: () => void;
  onError?: (error: Error) => void;
}

const GPTVisRenderer: React.FC<GPTVisRendererProps> = ({ syntax, width, height, onRender, onError }) => {
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
      wrapper: true,
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
      instanceRef.current.render(syntax);
      onRender?.();
    } catch (err) {
      onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  }, [syntax, width, height]);

  return <div ref={containerRef} className="w-full h-full" />;
};

export default GPTVisRenderer;
