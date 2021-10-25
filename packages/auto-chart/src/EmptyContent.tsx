import React from 'react';
import { intl, Language } from './i18n';
import { prefixCls } from './utils';

interface EmptyContentProps {
  language: Language;
  noDataContent: React.ReactNode;
  onOpenMock: () => void;
}

export const EmptyContent = ({ language, noDataContent, onOpenMock }: EmptyContentProps) => {
  return (
    <div className={`${prefixCls}no-data-layer`}>
      <div className={`${prefixCls}mock_guide`}>
        {noDataContent || (
          <div>
            <div style={{ marginBottom: 16 }}>
              <img
                src="https://gw.alipayobjects.com/zos/basement_prod/9a59280d-8f23-4234-b5cf-02956a91b6ff.svg"
                alt=""
              />
            </div>
            <div>{intl.get('NoData', language)}</div>
          </div>
        )}
        <div className={`${prefixCls}mock_guide_button`} onClick={onOpenMock}>
          {intl.get('Initialize', language)}
        </div>
      </div>
    </div>
  );
};
