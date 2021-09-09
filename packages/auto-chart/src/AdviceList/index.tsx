import React, { useState, useEffect } from 'react';
import { prefixCls, getThumbnailURL, customChartType } from '../utils';

interface AdviceListProps {
  advices: any[];
  currentIndex: number;
  containerHover: boolean;
  onChartChange: (valueIndex: number) => void;
};

export const AdviceList = ({ advices, currentIndex, containerHover, onChartChange }: AdviceListProps) => {
  const [adviceDisplay, setAdviceDisplay] = useState(false);
  // TODO || adviceToLibConfig(advice)
  const advicesTop3 = advices
  .filter((advice) => !customChartType.includes(advice.type))
  .slice(0, 3);

  const rankIcons = [
    'https://gw.alipayobjects.com/zos/antfincdn/61FtDvdTVl/no1.png',
    'https://gw.alipayobjects.com/zos/antfincdn/Y7AsvjRWNF/no2.png',
    'https://gw.alipayobjects.com/zos/antfincdn/2%24ruKwktmY/no3.png',
  ];

  const changeChartHandle = (index) => {
    if (currentIndex === index) return;
    onChartChange(index);
  };

  useEffect(() => {
    if (containerHover === false && adviceDisplay === true) {
      setAdviceDisplay(false);
    };
  }, [containerHover]);

  return (
    <div className={`${prefixCls}toolbar`}>
      <div className={`${prefixCls}config_btn`} style={{ display: containerHover ? 'block' : 'none'}} onClick={() => setAdviceDisplay(!adviceDisplay)}>
        <img src="https://gw.alipayobjects.com/zos/antfincdn/krFnwF2VZi/retweet.png" />
      </div>
      <div className={`${prefixCls}advice_container`} style={{ display: adviceDisplay ? 'block' : 'none'}}>
        <div className={`${prefixCls}advice_content`}>
          {
            advicesTop3.map((advice, index) => {
              return (
                <div className={`${prefixCls}advice`} key={index} onClick={() => changeChartHandle(index)}>
                  <div className={`${prefixCls}advice-thumbnail`} data-index={index}>
                    <img src={getThumbnailURL(advice.type)} data-index={index}/>
                  </div>
                  <div className={`${prefixCls}advice-desc`}>
                    <img src={rankIcons[index]} data-index={index} />
                    <div className="advice-chart-name" data-index={index}>折线图</div>
                    <div className="advice-score-text" data-index={index}>
                      推荐分 <span className="advice-score">{advice.score.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              );
            })
          }
        </div>
        <div className={`${prefixCls}advice_arrow`}>
        </div>
      </div>
    </div>
  );
};
