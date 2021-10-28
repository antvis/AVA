import React, { useRef, forwardRef, useImperativeHandle, useEffect } from 'react';
import { intl, Language } from '../i18n';
import { prefixCls, getElePosition } from '../utils';
import { withDrag, DragRefProps } from '../DragHoc';
import { MockContent, MockResultType } from './Content';

interface MockPanelProps {
  language: Language;
  mockDisplay: boolean;
  containerRef?: React.RefObject<HTMLDivElement>;
  onClose: () => void;
  onMockDataChange: (result: MockResultType) => void;
}

// eslint-disable-next-line react/display-name
const MockPanel = forwardRef((props: MockPanelProps, ref: DragRefProps) => {
  const { language, mockDisplay = false, containerRef, onMockDataChange } = props;
  const dragContainer = useRef<HTMLDivElement>(null);
  const dragHandler = useRef<HTMLDivElement>(null);

  const onConfigClose = () => {
    props.onClose();
  };

  useEffect(() => {
    if (mockDisplay) {
      if (containerRef) {
        const elePosition = getElePosition(containerRef.current, dragContainer.current);
        dragContainer.current.style.left = elePosition.left;
        dragContainer.current.style.top = elePosition.top;
      }
      dragContainer.current.style.display = 'block';
    }
    if (!mockDisplay && dragContainer) {
      dragContainer.current.style.display = 'none';
    }
  }, [mockDisplay]);

  useImperativeHandle(ref, () => {
    return {
      dragContainer: dragContainer.current,
      dragHandler: dragHandler.current,
    };
  });

  return (
    <div className={`${prefixCls}dev_panel`} style={{ width: 600, height: 604 }} ref={dragContainer}>
      <div className={`${prefixCls}config_panel`}>
        <div className={`${prefixCls}config_header`} ref={dragHandler}>
          {intl.get('Initialize', language)}
          <img src="https://gw.alipayobjects.com/zos/antfincdn/5mKWpRQ053/close.png" onClick={onConfigClose}></img>
        </div>
        <MockContent language={language} onMockDataChange={onMockDataChange} />
      </div>
    </div>
  );
});

const dragMockPanel = withDrag(MockPanel);

export { dragMockPanel as MockPanel };
