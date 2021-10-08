import React, { useRef, useEffect, MutableRefObject } from 'react';
import { createPortal } from 'react-dom';
import { draggable, getElePosition } from './utils';

export type DragRefProps = MutableRefObject<{
  dragContainer: HTMLDivElement;
  dragHandler: HTMLDivElement;
  containerRef: HTMLDivElement;
  dragDisplay: boolean;
}>;

export const withDrag = <P extends object>(DragComponent: React.ComponentType<P>): React.FC<P> => {
  const WithDrag: React.FC<P> = (props) => {
    const dragRef = useRef(null);
    useEffect(() => {
      if (dragRef) {
        const { dragContainer, dragHandler } = dragRef.current;
        draggable(dragContainer, dragHandler);
      };
    }, [dragRef]);

    useEffect(() => {
      const { dragDisplay, containerRef, dragContainer } = dragRef.current;
      if (dragDisplay && containerRef) {
        const elePosition = getElePosition(containerRef, dragContainer);
        dragContainer.style.left = elePosition.left;
        dragContainer.style.top = elePosition.top;
      }
    }, [dragRef.current?.dragDisplay, dragRef.current?.containerRef]);

    return createPortal(<DragComponent {...props} ref={dragRef} />, document.body);
  };
  WithDrag.displayName = `withDrag(${DragComponent.displayName || DragComponent.name})`;
  return WithDrag;
};
