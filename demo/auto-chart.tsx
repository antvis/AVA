import * as React from 'react';
import { autoChart } from '../packages/chart-advisor/src';

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
  config?: { type: string; configs: any };
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
  } = props;
  const container = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (container.current) {
      autoChart(container.current, data, {
        purpose,
        preferences,
        refine,
        theme,
        toolbar,
        development,
        config,
        noDataContent,
        fields,
      });
    }
  }, [props]);
  return (
    <div className="chart-container">
      <div className="chart-container-title">{title}</div>
      <div className="chart-container-description">{description}</div>
      <div className="canvas-container" ref={container}></div>
    </div>
  );
});
