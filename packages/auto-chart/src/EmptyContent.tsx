import React from 'react';
import { intl, Language } from './i18n';
import { prefixCls } from './utils';

interface EmptyContentProps {
  language: Language;
  onOpenMock: () => void;
};

export const EmptyContent = ({ language, onOpenMock }: EmptyContentProps) => {
  return (
    <div className={`${prefixCls}no-data-layer`}>
      <div className={`${prefixCls}mock_guide`}>
        <div style={{marginBottom: 16 }}>
          <img src="https://gw.alipayobjects.com/zos/basement_prod/9a59280d-8f23-4234-b5cf-02956a91b6ff.svg" />
        </div>
        <div>{intl.get('NoData', language)}</div>
        <div
          className={`${prefixCls}mock_guide_button`} 
          onClick={onOpenMock}>
            {intl.get('Initialize', language)}
          </div>
      </div>
    </div>
  );
};
