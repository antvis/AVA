import React, { useState, useRef, useEffect, CSSProperties } from 'react';
import { message, ConfigProvider } from 'antd';
import zhCN from 'antd/es/locale/zh_CN';
import enUS from 'antd/es/locale/en_US';
import { Advisor } from '@antv/chart-advisor';
import { Chart } from './ChartRender';
import { AdviceList } from './AdviceList';
import { EmptyContent } from './EmptyContent';
import { MockPanel } from './MockPanel';
import { Language, intl } from './i18n';
import { prefixCls } from './utils';
import type { Advice } from '@antv/chart-advisor';
import type { Purpose } from '@antv/ckb';
import type { MockResultType } from './MockPanel/Content';
import './index.less';

interface Props {
  data?: any[];
  fields?: string[];
  title?: string;
  description?: string;
  width?: CSSProperties['width'];
  height?: CSSProperties['height'];
  className?: string;
  language?: Language;
  purpose?: Purpose;
  showRanking?: boolean;
  // configurable?: boolean;
  noDataContent?: React.ReactNode;
}

export const AutoChart = (props: Props) => {
  const {
    data: propsData = [],
    width = '100%',
    height = '100%',
    language = 'zh-CN',
    noDataContent = null,
    className,
    title,
    description,
    showRanking = true,
    // configurable = true,
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
  const [mockDisplay, setMockDisplay] = useState<boolean>(false);

  useEffect(() => {
    if (containerRef) {
      containerRef.current.style.width = `${width}px`;
      containerRef.current.style.height = `${height}px`;
    }
  }, [width, height]);

  useEffect(() => {
    setAdvices([]);
    setCurrentData(propsData);
  }, [JSON.stringify(propsData)]);

  useEffect(() => {
    if (currentData.length > 0) {
      const myAdvices = myAdvisor.advise({ data: currentData });
      setAdvices(myAdvices);
      setCurrentAdviceIndex(0);
    }
  }, [currentData]);

  const onChartTypeChange = (index: number) => {
    setCurrentAdviceIndex(index);
  };

  const onMockDataChange = (mockResult: MockResultType) => {
    const { result } = mockResult;
    // setConfigs(null);
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
