import React, { useRef, useEffect, MutableRefObject } from 'react';
import { createPortal } from 'react-dom';
import { draggable } from './utils';


export type DragRefProps = MutableRefObject<{
  dragContainer: HTMLElement
  dragHander: HTMLElement
}>;


export const withDrag = <P extends object>(DragComponent: React.ComponentType<P>): React.FC<P> => {
  const WithDrag:React.FC<P> = (props) => {
    const dragRef = useRef<DragRefProps>(null);
    useEffect(() => {
      if (dragRef) {
        const { dragContainer, dragHander } = dragRef.current;
        draggable(dragContainer, dragHander);
      };
    }, [dragRef]);
    return (
      createPortal(
        <DragComponent {...props} ref={dragRef}/>,
        document.body
      )
    );
  };
  WithDrag.displayName = `withDrag(${DragComponent.displayName || DragComponent.name})`;
  return WithDrag;
};