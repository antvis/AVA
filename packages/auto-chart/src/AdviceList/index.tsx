import React, { useState, useEffect } from 'react';
import { CKBJson } from '@antv/ckb';
import { Thumbnail } from '@antv/thumbnails-component';
import { prefixCls, customChartType } from '../utils';
import { intl, Language } from '../i18n';
import type { ThumbnailID } from '@antv/thumbnails';
import type { Advice } from '@antv/chart-advisor';

interface AdviceListProps {
  language: Language;
  advices: Advice[];
  currentIndex: number;
  isActive: boolean;
  onChartTypeChange: (valueIndex: number) => void;
}

export const AdviceList = ({ advices, currentIndex, language, isActive, onChartTypeChange }: AdviceListProps) => {
  const [adviceDisplay, setAdviceDisplay] = useState(false);
  const ChartWiki = CKBJson(language, true);
  // TODO || adviceToLibConfig(advice)
  const advicesTop3 = advices.filter((advice) => !customChartType.includes(advice.type)).slice(0, 3);

  const rankIcons = [
    'https://gw.alipayobjects.com/zos/antfincdn/61FtDvdTVl/no1.png',
    'https://gw.alipayobjects.com/zos/antfincdn/Y7AsvjRWNF/no2.png',
    'https://gw.alipayobjects.com/zos/antfincdn/2%24ruKwktmY/no3.png',
  ];

  const changeChartHandle = (index) => {
    if (currentIndex === index) return;
    onChartTypeChange(index);
  };

  useEffect(() => {
    if (isActive === false && adviceDisplay === true) {
      setAdviceDisplay(false);
    }
  }, [isActive]);

  return (
    <div className={`${prefixCls}toolbar`}>
      <div
        className={`${prefixCls}config_btn`}
        style={{ display: isActive ? 'block' : 'none' }}
        onClick={() => setAdviceDisplay(!adviceDisplay)}
      >
        <img src="https://gw.alipayobjects.com/zos/antfincdn/krFnwF2VZi/retweet.png" alt="" />
      </div>
      <div className={`${prefixCls}advice_container`} style={{ display: adviceDisplay ? 'block' : 'none' }}>
        <div className={`${prefixCls}advice_content`}>
          {advicesTop3.map((advice, index) => {
            return (
              <div className={`${prefixCls}advice`} key={index} onClick={() => changeChartHandle(index)}>
                <div className={`${prefixCls}advice-thumbnail`} data-index={index}>
                  <Thumbnail chart={advice.type as ThumbnailID} data-index={index} />
                </div>
                <div className={`${prefixCls}advice-desc`}>
                  <img src={rankIcons[index]} data-index={index} />
                  <div className="advice-chart-name" data-index={index}>
                    {ChartWiki[advice.type].name}
                  </div>
                  <div className="advice-score-text" data-index={index}>
                    {intl.get('Score', language)}
                    <span className="advice-score">{advice.score.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className={`${prefixCls}advice_arrow`}></div>
      </div>
    </div>
  );
};
