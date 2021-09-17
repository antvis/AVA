import React, { useRef, forwardRef, useImperativeHandle, useEffect } from 'react';
import { intl, Language } from '../i18n';
import { prefixCls } from '../utils';
import { withDrag, DragRefProps } from '../DragHoc';
import { MockContent, MockResultType } from './Content';

interface MockPanelProps {
  language: Language;
  mockDisplay: boolean;
  containerRef?: React.RefObject<HTMLDivElement>;
  onClose: () => void;
  onMockDataChange: (result: MockResultType) => void;
};

// eslint-disable-next-line react/display-name
const MockPanel = forwardRef((props: MockPanelProps, ref: DragRefProps) => {
  const { language, mockDisplay, containerRef, onMockDataChange } = props;
  const dragContainer = useRef<HTMLElement>(null);
  const dragHander = useRef<HTMLElement>(null);

  const onConfigClose = () => {
    props.onClose();
  };

  useImperativeHandle(ref, () => {
    return { 
      dragContainer: dragContainer.current,
      dragHander: dragHander.current,
    };
  });

  useEffect(() => {
    if (mockDisplay && containerRef) {
      const left = containerRef.current.offsetLeft;
      const top = containerRef.current.offsetTop;
      const boxWidth = containerRef.current.offsetWidth;
      const dragWidth = dragContainer.current.offsetWidth;
      dragContainer.current.style.left = `${(left + boxWidth/2 - dragWidth/2)}px`;
      dragContainer.current.style.top = `${(top + 40)}px`;
    }
  }, [mockDisplay, containerRef]);

  return (
    <div className={`${prefixCls}dev_panel`} style={{ display: mockDisplay ? 'block' : 'none', width: 600, height: 620 }} ref={dragContainer}>
      <div className={`${prefixCls}config_panel`}>
        <div className={`${prefixCls}config_header`} ref={dragHander}>
          {intl.get('Initialize', language)}
          <img src="https://gw.alipayobjects.com/zos/antfincdn/5mKWpRQ053/close.png" onClick={onConfigClose}></img>
        </div>
        <MockContent 
          language={language}
          onMockDataChange={onMockDataChange}
        />
      </div>
    </div>
  );
});

const dragMockPanel = withDrag(MockPanel);

export { dragMockPanel as MockPanel };