import React, { useState, useRef, useEffect } from 'react';
import { Advisor } from '@antv/chart-advisor';
import { Chart } from './ChartRender';
import { AdviceList } from './AdviceList';
import { ChartConfigPanel, ChartConfigBtn } from './ChartConfigPanel';
import { prefixCls } from './utils';
import './index.less';

interface Props {
  className?: string;
  width?: number;
  height?: number;
  data?: any[];
  fields?: any[];
  /** TODO switching charts display or not */
  toolbar?:boolean;
  /** TODO mode */
  development?: boolean;
  title?: string;
  description?: string;
  purpose?: 'Comparison' | 'Trend' | 'Distribution' | 'Rank' | 'Proportion' | 'Composition';
};

export const AutoChart = (props: Props) => {
  const { data: propsData = [], width = 400, height = 400, fields, title, description } = props;
  const containerRef = useRef(null);
  const myAdvisor = new Advisor();
  const [advices, setAdvices] = useState([]);
  const [currentAdviseIndex, setCurrentAdviseIndex] = useState<number>(0);
  const [currentData, setCurrentData] = useState<any>(propsData || []);
  const [containerHover, setHover] = useState<boolean>(false);
  const [configDisplay, setConfigDisplay] = useState(false);

  useEffect(() => {
    if (containerRef) {
      containerRef.current.style.width = `${width}px`;
      containerRef.current.style.height = `${height}px`;
    };
  }, [width, height]);

  useEffect(() => {
    const myAdvices = myAdvisor.advise({data: currentData, fields });
    setAdvices(myAdvices);
    setCurrentAdviseIndex(0);
  }, [currentData]);

  return (
    <div className={`${prefixCls}container`} ref={containerRef} onMouseOver={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <Chart title={title} description={description} spec={advices[currentAdviseIndex]?.spec || null} />
      <AdviceList advices={advices} currentIndex={currentAdviseIndex} containerHover={containerHover} onChartChange={(index) => setCurrentAdviseIndex(index)}/>
      <ChartConfigBtn containerHover={containerHover} onClick={() => setConfigDisplay(!configDisplay)}/>
      <ChartConfigPanel configDisplay={configDisplay}/>
    </div>
  );
};
