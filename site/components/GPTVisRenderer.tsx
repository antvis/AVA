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

  useEffect(() => {
    if (!containerRef.current || !syntax) return;

    try {
      if (!instanceRef.current) {
        instanceRef.current = new GPTVis({
          container: containerRef.current,
          width,
          height,
          theme: 'light',
          wrapper: true,
        });
      }

      instanceRef.current.render(syntax);
      onRender?.();
    } catch (err) {
      onError?.(err instanceof Error ? err : new Error(String(err)));
    }

    return () => {
      if (instanceRef.current) {
        instanceRef.current.destroy();
        instanceRef.current = null;
      }
    };
  }, [syntax, width, height]);

  return <div ref={containerRef} className="w-full h-full" />;
};

export default GPTVisRenderer;
