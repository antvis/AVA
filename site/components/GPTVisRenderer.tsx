'use client';
import { useEffect, useEffectEvent, useRef } from 'react';
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

const GPTVisRenderer: React.FC<GPTVisRendererProps> = ({
  config,
  width,
  height,
  wrapper = false,
  onRender,
  onError,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const notifyRender = useEffectEvent(() => onRender?.());
  const notifyError = useEffectEvent((error: Error) => onError?.(error));

  useEffect(() => {
    if (!containerRef.current || !config) return;

    let active = true;
    const instance = new GPTVis({
      container: containerRef.current,
      width,
      height,
      theme: 'light',
      wrapper,
    });
    void (async () => {
      try {
        await instance.render(config);
        if (active) notifyRender();
      } catch (err) {
        if (active) notifyError(err instanceof Error ? err : new Error(String(err)));
      }
    })();

    return () => {
      active = false;
      instance.destroy();
    };
  }, [config, width, height, wrapper]);

  return <div ref={containerRef} className="w-full h-full" />;
};

export default GPTVisRenderer;
