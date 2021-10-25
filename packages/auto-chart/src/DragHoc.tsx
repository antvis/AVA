import React, { useRef, useEffect, MutableRefObject } from 'react';
import { createPortal } from 'react-dom';
import { draggable } from './utils';

export type DragRefProps = MutableRefObject<{
  dragContainer: HTMLDivElement;
  dragHandler: HTMLDivElement;
}>;

export const withDrag = <P extends object>(DragComponent: React.ComponentType<P>): React.FC<P> => {
  const WithDrag: React.FC<P> = (props) => {
    const dragRef = useRef(null);
    useEffect(() => {
      if (dragRef) {
        const { dragContainer, dragHandler } = dragRef.current;
        draggable(dragContainer, dragHandler);
      }
    }, [dragRef]);

    return createPortal(<DragComponent {...props} ref={dragRef} />, document.body);
  };
  WithDrag.displayName = `withDrag(${DragComponent.displayName || DragComponent.name})`;
  return WithDrag;
};
