import React, { useState, useRef, useEffect } from 'react';
import { get, set } from 'lodash';
import { Advisor } from '@antv/chart-advisor';
import { Chart } from './ChartRender';
import { AdviceList } from './AdviceList';
import { EmptyContent } from './EmptyContent';
import { ChartConfigPanel, ChartConfigBtn } from './ChartConfigPanel';
import { MockPanel } from './MockPanel';
import { Language, intl } from './i18n';
import { prefixCls } from './utils';
import type { Advice } from '@antv/chart-advisor';
import './index.less';

interface Props {
  className?: string;
  width?: number;
  height?: number;
  data?: any[];
  fields?: string[];
  language?: Language;
  /** TODO switching charts display or not */
  toolbar?:boolean;
  /** TODO mode */
  development?: boolean;
  title?: string;
  description?: string;
  purpose?: 'Comparison' | 'Trend' | 'Distribution' | 'Rank' | 'Proportion' | 'Composition';
};

export const AutoChart = (props: Props) => {
  const { data: propsData = [], width = 400, height = 400, language= 'zh-CN', fields: propsFields = [], title, description } = props;
  const containerRef = useRef<HTMLElement>(null);
  const chartRef = useRef(null);
  const myAdvisor = new Advisor();
  const [advices, setAdvices] = useState<Advice>([]);
  const [currentAdviceIndex, setCurrentAdviceIndex] = useState<number>(0);
  const [currentData, setCurrentData] = useState<any>(propsData || []);
  const [currentFields, setCurrentFields] = useState<string[]>(propsFields);
  const [mockType, setMockType] =useState<string>(null);
  const [mockConfigs, setMockConfigs] = useState<any>(null);
  const [isActive, setHover] = useState<boolean>(false);
  const [configDisplay, setConfigDisplay] = useState<boolean>(false);
  const [mockDisplay, setMockDisplay] = useState<boolean>(false);
  const [configs, setConfigs] = useState(null);

  useEffect(() => {
    if (containerRef) {
      containerRef.current.style.width = `${width}px`;
      containerRef.current.style.height = `${height}px`;
    };
  }, [width, height]);

  useEffect(() => {
    if (currentData.length > 0) {
      const myAdvices = myAdvisor.advise({data: currentData, fields: currentFields });
      setAdvices(myAdvices);
      setCurrentAdviceIndex(0);
    };
  }, [currentData]);

  const onConfigChange = (configsValue, configsTransValue) => {
    setConfigs(configsValue);
    if (configsTransValue) {
      if (typeof chartRef.current.chartType !== 'string') throw new Error('please set the plotType');
      if (chartRef.current.chartType === 'Pie') {
        const colorField = get(configsTransValue, 'colorField');
        if (colorField && !get(configsTransValue, 'statistic.title.formatter')) {
          set(configsTransValue, 'statistic.title.formatter', (datum: any) => {
            if (datum) {
              return datum[colorField];
            }
            return intl.get('Total', language);
          });
        }
      };
      chartRef.current.plot.update(configsTransValue);
    };
  };

  const onChartTypeChange = (index: number) => {
    setCurrentAdviceIndex(index);
    setConfigs(null);
  };

  const onMockDataChange = (mockres) => {
    const { result } = mockres;
    setConfigs(null);
    setMockDisplay(false);
    if (result.config) {
      setMockConfigs(result);
      setMockType('Chart');
      return;
    };
    // will delete 
    // setCurrentFields(['date', 'city']);
    setCurrentData([...result.data]);
  };

  return (
    <div className={`${prefixCls}container`} ref={containerRef} onMouseOver={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      {(currentData.length > 0 || mockType) && (
        <Chart title={title} description={description} chartRef={chartRef} spec={advices[currentAdviceIndex]?.spec || null} mockConfig={mockConfigs}/>
      )}
      {currentData.length > 0 && <AdviceList language={language} advices={advices} currentIndex={currentAdviceIndex} isActive={isActive} onChartTypeChange={onChartTypeChange}/>}
      {chartRef.current?.chartType && (
        <ChartConfigBtn isActive={isActive} onClick={() => setConfigDisplay(!configDisplay)}/>
      )}
      {chartRef.current?.chartType && (
        <ChartConfigPanel
          configDisplay={configDisplay}
          language={language}
          chartType={chartRef.current.chartType || null}
          onConfigChange={onConfigChange}
          configs={configs}
          containerRef={containerRef}
          onClose={() => setConfigDisplay(false)}
        />
      )}
      {currentData.length === 0 && !mockType && <EmptyContent language={language} onOpenMock={() => setMockDisplay(true)}/>}
      <MockPanel
        mockDisplay={mockDisplay}
        language={language}
        containerRef={containerRef}
        onClose={() => setMockDisplay(false)}
        onMockDataChange={onMockDataChange}
      />
    </div>
  );
};
