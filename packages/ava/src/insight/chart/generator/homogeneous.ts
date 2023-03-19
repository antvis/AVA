import { HomogeneousPatternInfo, InsightInfo, PointPatternInfo, VisualizationSpec } from '../../types';
import { INSIGHT_COLOR_PLATTE } from '../constants';
import { transparent } from '../strategy';

export function generateHomogeneousInsightAugmentedMarks(pattern: HomogeneousPatternInfo) {
  const annotations: any[] = [];
  const { insightType, childPatterns } = pattern;

  if (['change_point', 'time_series_outlier'].includes(insightType)) {
    const { x } = childPatterns[0] as PointPatternInfo;
    const text = insightType === 'change_point' ? 'Abrupt Change' : 'Outlier';
    const color = insightType === 'change_point' ? INSIGHT_COLOR_PLATTE.highlight : INSIGHT_COLOR_PLATTE.outlier;
    // draw line
    const line = {
      type: 'line',
      start: [x, 'min'],
      end: [x, 'max'],
      text: {
        content: text,
        position: 'left',
        offsetY: 15,
        offsetX: 5,
        rotate: 0,
        autoRotate: false,
        style: {
          textAlign: 'left',
        },
      },
    };
    annotations.push(line);
    // draw circle
    const circles = childPatterns.map((pattern) => {
      const { y } = pattern as PointPatternInfo;
      return {
        type: 'dataMarker',
        position: [x, y],
        point: {
          style: {
            fill: '#fff',
            stroke: color,
          },
        },
        line: {
          length: 20,
        },
        autoAdjust: false,
      };
    });
    annotations.push(...circles);
  }

  return annotations;
}

export function generateHomogeneousInsightChartSpec(
  insight: InsightInfo<HomogeneousPatternInfo>,
  pattern: HomogeneousPatternInfo
): VisualizationSpec[] {
  const { dimensions, measures } = insight;

  let plotSchema;
  if (measures.length > 1) {
    plotSchema = {
      xField: dimensions[0],
      yField: 'value',
      seriesField: 'measureName',
    };
  } else {
    plotSchema = {
      xField: dimensions[1],
      yField: measures[0].fieldName,
      seriesField: dimensions[0],
    };
  }

  const style = transparent(pattern);
  const annotationConfig = generateHomogeneousInsightAugmentedMarks(pattern);

  const chartSchema = {
    ...plotSchema,
    ...style,
    annotations: annotationConfig,
  };

  return chartSchema;
}
