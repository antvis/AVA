import * as React from 'react';
import { autoChart, G2PlotConfig, ChartRuleConfigMap } from '../packages/chart-advisor/src';

interface Props {
  theme?: string;
  data: any[] | Promise<any[]>;
  purpose?: string;
  preferences?: any;
  refine?: boolean;
  title?: string;
  description?: string;
  toolbar?: boolean;
  development?: boolean;
  config?: G2PlotConfig;
  chartRuleConfigs?: ChartRuleConfigMap;
  fields?: string[];
  noDataContent?: any;
}

export default React.memo(function Chart(props: Props) {
  const {
    data,
    purpose,
    preferences,
    refine,
    theme,
    title,
    fields,
    noDataContent,
    description,
    development,
    toolbar = true,
    config,
    chartRuleConfigs,
  } = props;
  const container = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (container.current) {
      autoChart(container.current, data, {
        purpose,
        preferences,
        refine,
        title,
        description,
        theme,
        toolbar,
        development,
        config,
        chartRuleConfigs,
        noDataContent,
        fields,
      });
    }
  }, [props]);
  return <div className="chart-container" ref={container}></div>;
});
