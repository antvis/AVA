/**
 * 自动图表
 *
 * @example
 *
 * ```typescript
 *  const container = document.getElementById('mountNode');
 *  import { autoChart } from '@antv/chart-advisor';
 *
 *  const data = [
 *   {date: '2020/01/01', value: '666'},
 *   {date: '2020/01/02', value: '888'},
 *   ...
 *  ];
 *  autoChart(container, data);
 * ```
 *
 * @packageDocumentation
 */

import { AutoChart, AutoChartOptions, Preferences } from './auto-chart';

/**
 * 自动图表
 * @param container - 容器
 * @param data - 数据
 * @param options - 配置
 * @public
 */
export async function autoChart(
  container: HTMLElement,
  data: any[] | Promise<any[]>,
  options?: AutoChartOptions
): Promise<void> {
  await AutoChart.create(container, data, options);
}

export { AutoChartOptions, Preferences };

export {
  dataToDataProps,
  dataPropsToSpecs,
  specToLibConfig,
  FieldInfo,
  Advice,
  AdvisorOptions,
  Channels,
} from './advisor';

export { ChartLibrary, getMappingForLib, Mapping, TypeMapping, ConfigMapping } from './chartLibMapping';

export { insightsFromData, Insight, InsightProps } from './insight';

export { InsightType, INSIGHT_TYPES, insightWorkers, Worker } from './insight/insightWorkers';
