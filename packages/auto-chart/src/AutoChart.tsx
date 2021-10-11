import React, { useState, useRef, useEffect } from 'react';
import { get, set } from 'lodash';
import { message, ConfigProvider } from 'antd';
import zhCN from 'antd/es/locale/zh_CN';
import enUS from 'antd/es/locale/en_US';
import { Advisor } from '@antv/chart-advisor';
import { Chart } from './ChartRender';
import { AdviceList } from './AdviceList';
import { EmptyContent } from './EmptyContent';
import { ChartConfigPanel, ChartConfigBtn } from './ConfigPanel';
import { MockPanel } from './MockPanel';
import { Language, intl } from './i18n';
import { prefixCls } from './utils';
import type { Advice } from '@antv/chart-advisor';
import type { MockResultType } from './MockPanel/Content';
import './index.less';

interface Props {
  className?: string;
  width?: number;
  height?: number;
  data?: any[];
  fields?: string[];
  language?: Language;
  showRanking?: boolean;
  configurable?: boolean;
  title?: string;
  description?: string;
  noDataContent?: React.ReactNode;
  purpose?: 'Comparison' | 'Trend' | 'Distribution' | 'Rank' | 'Proportion' | 'Composition';
}

export const AutoChart = (props: Props) => {
  const {
    data: propsData = [],
    width = 400,
    height = 400,
    language = 'zh-CN',
    noDataContent = null,
    className,
    title,
    description,
    showRanking = true,
    configurable = true
  } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef(null);
  const myAdvisor = new Advisor();
  const [advices, setAdvices] = useState<Advice[]>([]);
  const [currentAdviceIndex, setCurrentAdviceIndex] = useState<number>(0);
  const [currentData, setCurrentData] = useState<any>(propsData || []);
  const [mockType, setMockType] = useState<string>(null);
  const [mockConfigs, setMockConfigs] = useState<any>(null);
  const [isActive, setHover] = useState<boolean>(false);
  const [configDisplay, setConfigDisplay] = useState<boolean>(false);
  const [mockDisplay, setMockDisplay] = useState<boolean>(false);
  const [configs, setConfigs] = useState(null);

  useEffect(() => {
    if (containerRef) {
      containerRef.current.style.width = `${width}px`;
      containerRef.current.style.height = `${height}px`;
    }
  }, [width, height]);

  useEffect(() => {
    setAdvices([]);
    setCurrentData(propsData);
  }, [propsData]);

  useEffect(() => {
    if (currentData.length > 0) {
      const myAdvices = myAdvisor.advise({ data: currentData });
      setAdvices(myAdvices);
      setCurrentAdviceIndex(0);
    }
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
      }
      chartRef.current.plot.update(configsTransValue);
    }
  };

  const onChartTypeChange = (index: number) => {
    setCurrentAdviceIndex(index);
    setConfigs(null);
  };

  const onMockDataChange = (mockResult: MockResultType) => {
    const { result } = mockResult;
    setConfigs(null);
    setMockDisplay(false);
    if (result.config) {
      setMockConfigs(result);
      setMockType('Chart');
      return;
    }
    if (result.data) {
      const myAdvices = myAdvisor.advise({ data: result.data });
      if (myAdvices.length > 0) {
        setCurrentData([...result.data]);
      } else {
        message.error(intl.get('Please Initialize Data Again', language));
      }
    }
  };

  return (
    <ConfigProvider locale={language === 'zh-CN' ? zhCN : enUS}>
      <div
        className={`${prefixCls}container ${className || ''}`}
        ref={containerRef}
        onMouseOver={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        {(currentData.length > 0 || mockType) && (
          <Chart
            title={title}
            description={description}
            chartRef={chartRef}
            spec={advices[currentAdviceIndex]?.spec || null}
            mockConfig={mockConfigs}
          />
        )}
        {showRanking && currentData.length > 0 && advices.length > 0 && (
          <AdviceList
            language={language}
            advices={advices}
            currentIndex={currentAdviceIndex}
            isActive={isActive}
            onChartTypeChange={onChartTypeChange}
          />
        )}
        {configurable && chartRef.current?.chartType && (
          <ChartConfigBtn isActive={isActive} onClick={() => setConfigDisplay(!configDisplay)} />
        )}
        {configurable && chartRef.current?.chartType && (
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
        {currentData.length === 0 && !mockType && (
          <EmptyContent language={language} noDataContent={noDataContent} onOpenMock={() => setMockDisplay(true)} />
        )}
        <MockPanel
          mockDisplay={mockDisplay}
          language={language}
          containerRef={containerRef}
          onClose={() => setMockDisplay(false)}
          onMockDataChange={onMockDataChange}
        />
      </div>
    </ConfigProvider>
  );
};
