import React, { useState } from 'react';
import { Tabs, InputNumber, Button, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { prefixCls } from '../utils';
import { intl, Language } from '../i18n';
import { CONFIG_MAP } from './utils/configs';
import { mock, Field, mockFields } from './utils/mockdata';
import { ChartContent } from './ChartContent';
import { DataContent } from './DataContent';

export type MockResultType = {
  result: {
    config?: any;
    data: any[];
  };
};

interface MockContentProps {
  language: Language;
  onMockDataChange: (result: MockResultType) => void;
}

export const MockContent = (props: MockContentProps) => {
  const { language } = props;
  const [tabkey, setTabkey] = useState<string>('chart');
  const [chartType, setChartType] = useState<string>(null);
  const [count, setCount] = useState<number>(20);
  const [customizeData, setCustomizeData] = useState<Field[]>(mock(mockFields, 20));
  const onMockChartTypeChange = (key: string) => {
    setChartType(key);
  };

  const onDeploy = () => {
    if (tabkey === 'chart' && chartType) {
      const { data, ...restConfig } = CONFIG_MAP[chartType];
      const config = { ...restConfig, chartType };
      props.onMockDataChange({
        result: { config, data },
      });
    } else if (tabkey === 'data') {
      props.onMockDataChange({
        result: { data: [...customizeData] },
      });
    }
  };

  return (
    <>
      <div className={`${prefixCls}config_content`}>
        <Tabs tabBarGutter={25} tabBarStyle={{ paddingLeft: 20 }} activeKey={tabkey} onChange={setTabkey}>
          <Tabs.TabPane tab={intl.get('Select Chart', language)} key="chart" />
          <Tabs.TabPane tab={intl.get('Mock Data', language)} key="data" />
        </Tabs>
        {tabkey === 'chart' && (
          <ChartContent language={language} chartType={chartType} onMockChartTypeChange={onMockChartTypeChange} />
        )}
        {tabkey === 'data' && (
          <DataContent
            language={language}
            count={count}
            customizeData={customizeData}
            onFieldDataChange={setCustomizeData}
          />
        )}
      </div>
      <div className={`${prefixCls}config_footer`}>
        {tabkey === 'chart' && (
          <div className={`${prefixCls}config_chart_footer`}>
            <Button disabled={!chartType} type="primary" onClick={onDeploy}>
              {intl.get('Configure', language)}
            </Button>
          </div>
        )}
        {tabkey === 'data' && (
          <div className={`${prefixCls}config_data_footer`}>
            <div>
              <Tooltip title={intl.get('Display up to 100 items', language)}>
                {intl.get('Rows')}
                <InfoCircleOutlined className={`${prefixCls}number_tip`} />
              </Tooltip>
              <InputNumber onChange={(countValue) => setCount(countValue)} value={count} min={0} step={1} />
            </div>
            <Button type="primary" onClick={onDeploy}>
              {intl.get('Apply data', language)}
            </Button>
          </div>
        )}
      </div>
    </>
  );
};
